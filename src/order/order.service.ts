import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientGrpc } from '@nestjs/microservices';
import { Like, Repository } from 'typeorm';
import { lastValueFrom } from 'rxjs';
import { CreateOrderResponse, GetAllOrdersRequest, GetAllOrdersResponse, GetOrderRequest, GetOrderResponse, GetUserRequest, GetUserResponse, User, Order as OrderProto, Table as TableProto, CreateTableResponse, GetTablesByNameResponse, GetAllTablesResponse, UpdateTableStateResponse, CreateSaleResponse, GetAllSalesResponse, GetSalesByDateResponse, GetSalesByUserResponse } from './proto/order.pb';
import { ProductServiceClient, PRODUCT_SERVICE_NAME, FindOneRequest, FindOneResponse } from './proto/product.pb';
import { AuthServiceClient, AUTH_SERVICE_NAME, GetUserRequest as AuthGetUserRequest, GetUserResponse as AuthGetUserResponse } from './proto/auth.pb';
import { CreateOrderRequestDto, CreateSaleDto, CreateTableRequestDto, GetSalesByDateDto, GetSalesByUserDto, GetTablesByNameDto, UpdateTableStateDto } from './order.dto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/orderItem.entity';
import { Table } from './entities/table.entity';
import { Sale } from './entities/sale.entity';

@Injectable()
export class OrderService {
  @InjectRepository(Order)
  private readonly repository: Repository<Order>;

  @InjectRepository(OrderItem)
  private readonly itemRepository: Repository<OrderItem>;

  @InjectRepository(Table)
  private readonly tableRepository: Repository <Table>;

  @InjectRepository(Sale)
  private readonly saleRepository: Repository <Sale>;

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

  public async createTable (table: CreateTableRequestDto): Promise <CreateTableResponse> {
    await this.tableRepository.save(table);    
    
    return { status: HttpStatus.CREATED, errors: null};
  }

  public async getTablesByName ( {name} : GetTablesByNameDto): Promise <GetTablesByNameResponse> {
    const table: Table = await this.tableRepository.findOne({
      where: {
        name,
      },
    });

    if(!table) {
      return { status: HttpStatus.NOT_FOUND, errors: [`Table with name ${name} not found`], table: null }
    }

    const tableProto: TableProto = {
      id: table.id,
      name: table.name,
      quantity: table.quantity,
      state: table.state,
    };
    
    return { status: HttpStatus.OK, errors: null, table: tableProto};
  }

  public async getAllTables () : Promise <GetAllTablesResponse>{

    const tables: Table[] = await this.tableRepository.find();

    if(!tables) {
      return { status: HttpStatus.NOT_FOUND, errors: [`Tables are not found`], tables: null }
    }

    return { status: HttpStatus.OK, errors: null, tables: tables};
  }

  public async updateTableState ( {id,quantity,state}: UpdateTableStateDto ) : Promise <UpdateTableStateResponse> {
    const table: Table = await this.tableRepository.findOne( { where: {id} } );

    if(!table) {
      return { status: HttpStatus.NOT_FOUND, errors: [`Table with id ${id} is not found`]}
    }

    table.quantity = quantity;
    table.state = state;
    
    await this.tableRepository.save(table);

    return { status: HttpStatus.OK, errors: null};
  }

  public async createOrder({ products, userId, nameTable }: CreateOrderRequestDto): Promise<CreateOrderResponse> {
    const userRequest: AuthGetUserRequest = { userId };
    const userResponse: AuthGetUserResponse = await lastValueFrom(this.userService.getUser(userRequest));
    if (userResponse.status !== HttpStatus.OK) {
      return { status: HttpStatus.BAD_REQUEST, errors: [`User with ID ${userId} not found`], id: null };
    }

    const order = new Order();
    order.userId = userId;
    const table = await this.tableRepository.findOne({ where: {name: nameTable}})
    order.table = table;

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
      table: order.table,
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

  public async createSale (sale: CreateSaleDto): Promise <CreateSaleResponse> {
    await this.saleRepository.save(sale);

    return { status: HttpStatus.CREATED, errors: null};
  }

  public async getAllSales (): Promise <GetAllSalesResponse> {
    const sales: Sale[] = await this.saleRepository.find();

    if(!sales) {
      return { status: HttpStatus.NOT_FOUND, errors: [`Sales are not found`], sales: null }
    }
    
    return { status: HttpStatus.OK, errors: null, sales: sales};
  }

  public async getSalesByUser ({userName}: GetSalesByUserDto): Promise <GetSalesByUserResponse> {
    const sales: Sale[] = await this.saleRepository.find({
      where: {
        userName: Like(`%${userName}%`),
      },
    });
    
    if(!sales) {
      return { status: HttpStatus.NOT_FOUND, errors: [`Sales are not found`], sales: null }
    }
    
    return { status: HttpStatus.OK, errors: null, sales: sales};
  }

  public async getSalesByDate ({date}: GetSalesByDateDto): Promise <GetSalesByUserResponse> {
    const sales: Sale[] = await this.saleRepository.find({
      where: {
        date: Like(`%${date}%`),
      },
    });
    
    if(!sales) {
      return { status: HttpStatus.NOT_FOUND, errors: [`Sales are not found`], sales: null }
    }
    
    return { status: HttpStatus.OK, errors: null, sales: sales};
  }
}
