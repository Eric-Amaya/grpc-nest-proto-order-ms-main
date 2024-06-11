import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientGrpc } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import { lastValueFrom } from 'rxjs';
import { CreateOrderRequest, CreateOrderResponse, GetAllOrdersRequest, GetAllOrdersResponse, GetOrderRequest, GetOrderResponse, GetUserRequest, GetUserResponse, User, Order as OrderProto } from './proto/order.pb';
import { Order, OrderItem } from './order.entity';
import { ProductServiceClient, PRODUCT_SERVICE_NAME, FindOneRequest, FindOneResponse } from './proto/product.pb';
import { AuthServiceClient, AUTH_SERVICE_NAME, GetUserRequest as AuthGetUserRequest, GetUserResponse as AuthGetUserResponse } from './proto/auth.pb';

@Injectable()
export class OrderService {
  @InjectRepository(Order)
  private readonly repository: Repository<Order>;

  @InjectRepository(OrderItem)
  private readonly itemRepository: Repository<OrderItem>;

  private productService: ProductServiceClient;
  private userService: AuthServiceClient;

  @Inject(PRODUCT_SERVICE_NAME)
  private readonly productClient: ClientGrpc;

  @Inject(AUTH_SERVICE_NAME)
  private readonly userClient: ClientGrpc;

  onModuleInit() {
    this.productService = this.productClient.getService<ProductServiceClient>(PRODUCT_SERVICE_NAME);
    this.userService = this.userClient.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  public async createOrder({ products, userId, tableNumber }: CreateOrderRequest): Promise<CreateOrderResponse> {
    const userRequest: AuthGetUserRequest = { userId };
    const userResponse: AuthGetUserResponse = await lastValueFrom(this.userService.getUser(userRequest));
    if (userResponse.status !== HttpStatus.OK) {
      return { status: HttpStatus.BAD_REQUEST, errors: [`User with ID ${userId} not found`], id: null };
    }

    const order = new Order();
    order.userId = userId;
    order.tableNumber = tableNumber;

    const orderItems: OrderItem[] = [];
    let totalPrice = 0;

    for (const product of products) {
      const findOneRequest: FindOneRequest = { id: product.productId };
      const findOneResponse: FindOneResponse = await lastValueFrom(this.productService.findOne(findOneRequest));
      if (findOneResponse.status !== HttpStatus.OK) {
        return { status: HttpStatus.BAD_REQUEST, errors: [`Product with ID ${product.productId} not found`], id: null };
      }

      const orderItem = new OrderItem();
      orderItem.productId = product.productId;
      orderItem.quantity = product.quantity;
      orderItem.order = order;
      orderItems.push(orderItem);

      totalPrice += findOneResponse.data.price * product.quantity;
    }

    order.items = orderItems;
    order.totalPrice = totalPrice;

    await this.repository.save(order);

    return { status: HttpStatus.CREATED, errors: null, id: order.id };
  }

  public async getOrder({ orderId }: GetOrderRequest): Promise<GetOrderResponse> {
    const order = await this.repository.findOne({ where: { id: orderId }, relations: ['items'] });

    if (!order) {
      return { status: HttpStatus.NOT_FOUND, errors: ['Order not found'], order: null };
    }

    const userRequest: AuthGetUserRequest = { userId: order.userId };
    const userResponse: AuthGetUserResponse = await lastValueFrom(this.userService.getUser(userRequest));

    let user: User = null;

    if (userResponse.status === HttpStatus.OK) {
      user = userResponse.user;
    }

    // Agregar el usuario al objeto de orden
    const orderProto: OrderProto = {
      id: order.id,
      userId: order.userId,
      tableNumber: order.tableNumber,
      totalPrice: order.totalPrice,
      items: order.items,
      user,
    };

    return { status: HttpStatus.OK, errors: null, order: orderProto };
  }

  public async getAllOrders(_: GetAllOrdersRequest): Promise<GetAllOrdersResponse> {
    const orders = await this.repository.find({ relations: ['items'] });
    const orderProtos: OrderProto[] = await Promise.all(
      orders.map(async (order) => {
        const userRequest: AuthGetUserRequest = { userId: order.userId };
        const userResponse: AuthGetUserResponse = await lastValueFrom(this.userService.getUser(userRequest));

        let user: User = null;

        if (userResponse.status === HttpStatus.OK) {
          user = userResponse.user;
        }

        return { ...order, user };
      })
    );

    return { status: HttpStatus.OK, errors: null, orders: orderProtos };
  }

  public async getUser({ userId }: GetUserRequest): Promise<GetUserResponse> {
    const userRequest: AuthGetUserRequest = { userId };
    const userResponse: AuthGetUserResponse = await lastValueFrom(this.userService.getUser(userRequest));

    if (userResponse.status !== HttpStatus.OK) {
      return { status: HttpStatus.BAD_REQUEST, errors: [`User with ID ${userId} not found`], user: null };
    }

    return { status: HttpStatus.OK, errors: null, user: userResponse.user };
  }
}
