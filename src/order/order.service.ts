import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientGrpc } from '@nestjs/microservices';
import { Any, Like, Repository } from 'typeorm';
import { lastValueFrom } from 'rxjs';
import {
  CreateOrderResponse,
  GetAllOrdersRequest,
  GetAllOrdersResponse,
  GetOrderRequest,
  GetOrderResponse,
  GetUserRequest,
  GetUserResponse,
  User,
  Order as OrderProto,
  Table as TableProto,
  CreateTableResponse,
  GetTablesByNameResponse,
  GetAllTablesResponse,
  UpdateTableStateResponse,
  CreateSaleResponse,
  GetAllSalesResponse,
  GetSalesByDateResponse,
  GetSalesByUserResponse,
  GetAllSalesRequest,
  DeleteOrderItemRequest,
  DeleteOrderItemResponse,
  UpdateOrderResponse,
} from './proto/order.pb';
import {
  ProductServiceClient,
  PRODUCT_SERVICE_NAME,
  FindOneRequest,
  FindOneResponse,
  UpdateProductRequest,
} from './proto/product.pb';
import {
  AuthServiceClient,
  AUTH_SERVICE_NAME,
  GetUserRequest as AuthGetUserRequest,
  GetUserResponse as AuthGetUserResponse,
} from './proto/auth.pb';
import {
  CreateOrderRequestDto,
  CreateSaleDto,
  CreateTableRequestDto,
  GetSalesByDateDto,
  GetSalesByUserDto,
  GetTablesByNameDto,
  UpdateOrderDto,
  UpdateTableStateDto,
} from './order.dto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/orderItem.entity';
import { Table } from './entities/table.entity';
import { Sale } from './entities/sale.entity';
import { EmailService } from './extra/send_email';

interface Product {
  id: number;
  name: string;
  sku: string;
  stock: number;
  price: number;
  category: string;
  description: string;
}

@Injectable()
export class OrderService {
  @InjectRepository(Order)
  private readonly repository: Repository<Order>;

  @InjectRepository(OrderItem)
  private readonly itemRepository: Repository<OrderItem>;

  @InjectRepository(Table)
  private readonly tableRepository: Repository<Table>;

  @InjectRepository(Sale)
  private readonly saleRepository: Repository<Sale>;

  private productService: ProductServiceClient;
  private userService: AuthServiceClient;

  @Inject(PRODUCT_SERVICE_NAME)
  private readonly productClient: ClientGrpc;

  @Inject(AUTH_SERVICE_NAME)
  private readonly userClient: ClientGrpc;

  @Inject(EmailService)
  private readonly emailService: EmailService;

  onModuleInit() {
    this.productService =
      this.productClient.getService<ProductServiceClient>(PRODUCT_SERVICE_NAME);
    this.userService =
      this.userClient.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  public async createTable(
    table: CreateTableRequestDto,
  ): Promise<CreateTableResponse> {
    await this.tableRepository.save(table);    
   
    return { status: HttpStatus.CREATED, errors: null };
  }

  public async getTablesByName({
    name,
  }: GetTablesByNameDto): Promise<GetTablesByNameResponse> {
    const table: Table = await this.tableRepository.findOne({
      where: {
        name,
      },
    });

    if (!table) {
      return {
        status: HttpStatus.NOT_FOUND,
        errors: [`Table with name ${name} not found`],
        table: null,
      };
    }

    const tableProto: TableProto = {
      id: table.id,
      name: table.name,
      quantity: table.quantity,
      state: table.state,
      activeOrderId: table.activeOrderId
    };
    
    return { status: HttpStatus.OK, errors: null, table: tableProto };
  }

  public async getAllTables(): Promise<GetAllTablesResponse> {
    const tables: Table[] = await this.tableRepository.find();

    if (!tables) {
      return {
        status: HttpStatus.NOT_FOUND,
        errors: [`Tables are not found`],
        tables: null,
      };
    }

    return { status: HttpStatus.OK, errors: null, tables: tables };
  }

  public async updateTableState({
    id,
    quantity,
    state,
    activeOrderId
  }: UpdateTableStateDto): Promise<UpdateTableStateResponse> {
    const table: Table = await this.tableRepository.findOne({ where: { id } });

    if (!table) {
      return {
        status: HttpStatus.NOT_FOUND,
        errors: [`Table with id ${id} is not found`],
      };
    }

    table.quantity = quantity;
    table.state = state;
    table.activeOrderId = activeOrderId;
    
    await this.tableRepository.save(table);

    return { status: HttpStatus.OK, errors: null };
  }

  public async createOrder({
    products,
    userId,
    nameTable,
    email,
  }: CreateOrderRequestDto): Promise<CreateOrderResponse> {
    try {
      const userRequest: AuthGetUserRequest = { userId };
      const userResponse: AuthGetUserResponse = await lastValueFrom(
        this.userService.getUser(userRequest),
      );
      if (userResponse.status !== HttpStatus.OK) {
        return {
          status: HttpStatus.BAD_REQUEST,
          errors: [`User with ID ${userId} not found`],
          id: null,
        };
      }
      const table = await this.tableRepository.findOne({
        where: { name: nameTable },
      });
      if (!table) {
        return {
          status: HttpStatus.NOT_FOUND,
          errors: [`Table ${nameTable} is not found`],
          id: null,
        };
      }

      const order = new Order();
      order.userId = userId;
      order.table = table;
      order.email = email;

      const orderItems: OrderItem[] = [];
      let totalPrice = 0;

      for (const product of products) {
        const findOneRequest: FindOneRequest = { id: product.productId };
        const findOneResponse: FindOneResponse = await lastValueFrom(
          this.productService.findOne(findOneRequest),
        );
        if (findOneResponse.status !== HttpStatus.OK) {
          return {
            status: HttpStatus.BAD_REQUEST,
            errors: [`Product with ID ${product.productId} not found`],
            id: null,
          };
        }

        const orderItem = new OrderItem();
        orderItem.productId = product.productId;
        orderItem.quantity = product.quantity;
        orderItem.modifications = product.modifications;
        orderItem.productName = findOneResponse.data.name;
        orderItem.pricePerUnit = findOneResponse.data.price;
        orderItem.totalPrice = findOneResponse.data.price * product.quantity;
        orderItem.order = order;
        orderItems.push(orderItem);

        totalPrice += orderItem.totalPrice;
      }

      order.items = orderItems;
      order.totalPrice = totalPrice;

      await this.repository.save(order);

      return { status: HttpStatus.CREATED, errors: null, id: order.id };
    } catch (error) {
      throw error;
    }
  }

  public async getOrder({
    orderId,
  }: GetOrderRequest): Promise<GetOrderResponse> {
    const order = await this.repository.findOne({
      where: { id: orderId },
      relations: ['table', 'items'],
    });

    if (!order) {
      return {
        status: HttpStatus.NOT_FOUND,
        errors: ['Order not found'],
        order: null,
      };
    }

    const userRequest: AuthGetUserRequest = { userId: order.userId };
    const userResponse: AuthGetUserResponse = await lastValueFrom(
      this.userService.getUser(userRequest),
    );

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
      items: await Promise.all(
        order.items.map(async (item) => {
        const findOneRequest: FindOneRequest = { id: item.productId };
        const findOneResponse: FindOneResponse = await lastValueFrom(
          this.productService.findOne(findOneRequest),
        );

        return {
          productId: item.productId,
          quantity: item.quantity,
          modifications: item.modifications,
          productName: findOneResponse.data.name,
          pricePerUnit: findOneResponse.data.price,
            totalPrice: findOneResponse.data.price * item.quantity,
          };
        }),
      ),
      user,
      email: order.email,
    };

    return { status: HttpStatus.OK, errors: null, order: orderProto };
  }

  public async updateOrder({
    orderId,
    products,
    userId,
    nameTable,
    email,
  }: UpdateOrderDto): Promise<UpdateOrderResponse> {
    const order = await this.repository.findOne({
      where: { id: orderId },
      relations: ['table', 'items'],
    });

    if (!order) {
      return {
        status: HttpStatus.NOT_FOUND,
        errors: [`Order with ID ${orderId} not found`],
      };
    }

    const userRequest: AuthGetUserRequest = { userId };
    const userResponse: AuthGetUserResponse = await lastValueFrom(
      this.userService.getUser(userRequest),
    );

    if (userResponse.status !== HttpStatus.OK) {
      return {
        status: HttpStatus.BAD_REQUEST,
        errors: [`User with ID ${userId} not found`],
      };
    }

    const table = await this.tableRepository.findOne({
      where: { name: nameTable },
    });

    if (!table) {
      return {
        status: HttpStatus.NOT_FOUND,
        errors: [`Table ${nameTable} not found`],
      };
    }

    order.userId = userId;
    order.table = table;
    order.email = email;

    const orderItems: OrderItem[] = [];
    let totalPrice = 0;

    for (const product of products) {
      const findOneRequest: FindOneRequest = { id: product.productId };
      const findOneResponse: FindOneResponse = await lastValueFrom(
        this.productService.findOne(findOneRequest),
      );
      if (findOneResponse.status !== HttpStatus.OK) {
        return {
          status: HttpStatus.BAD_REQUEST,
          errors: [`Product with ID ${product.productId} not found`],
        };
      }

      const orderItem = new OrderItem();
      orderItem.productId = product.productId;
      orderItem.quantity = product.quantity;
      orderItem.modifications = product.modifications;
      orderItem.productName = findOneResponse.data.name;
      orderItem.pricePerUnit = findOneResponse.data.price;
      orderItem.totalPrice = findOneResponse.data.price * product.quantity;
      orderItem.order = order;
      orderItems.push(orderItem);

      totalPrice += orderItem.totalPrice;
    }

    order.items = orderItems;
    order.totalPrice = totalPrice;

    await this.repository.save(order);

    return { status: HttpStatus.CREATED, errors: null, }; 
  }

  public async getAllOrders(
    _: GetAllOrdersRequest,
  ): Promise<GetAllOrdersResponse> {
    const orders = await this.repository.find({
      relations: ['table', 'items'],
    });
    const orderProtos: OrderProto[] = await Promise.all(
      orders.map(async (order) => {
        const userRequest: AuthGetUserRequest = { userId: order.userId };
        const userResponse: AuthGetUserResponse = await lastValueFrom(
          this.userService.getUser(userRequest),
        );

        let user: User = null;

        if (userResponse.status === HttpStatus.OK) {
          user = userResponse.user;
        }

        return { ...order, user };
      }),
    );

    return { status: HttpStatus.OK, errors: null, orders: orderProtos };
  }

  public async getUser({ userId }: GetUserRequest): Promise<GetUserResponse> {
    const userRequest: AuthGetUserRequest = { userId };
    const userResponse: AuthGetUserResponse = await lastValueFrom(
      this.userService.getUser(userRequest),
    );

    if (userResponse.status !== HttpStatus.OK) {
      return {
        status: HttpStatus.BAD_REQUEST,
        errors: [`User with ID ${userId} not found`],
        user: null,
      };
    }

    return { status: HttpStatus.OK, errors: null, user: userResponse.user };
  }

  public async getAllSales(
    _: GetAllSalesRequest,
  ): Promise<GetAllSalesResponse> {
    const sales: Sale[] = await this.saleRepository.find({
      relations: ['products'],
    });

    if (!sales) {
      return {
        status: HttpStatus.NOT_FOUND,
        errors: [`Sales are not found`],
        sales: null,
      };
    }

    return { status: HttpStatus.OK, errors: null, sales: sales };
  }

  public async getSalesByUser({
    userName,
  }: GetSalesByUserDto): Promise<GetSalesByUserResponse> {
    const sales: Sale[] = await this.saleRepository.find({
      where: {
        userName: Like(`%${userName}%`),
      },
      relations: ['products'],
    });

    if (!sales) {
      return {
        status: HttpStatus.NOT_FOUND,
        errors: [`Sales are not found`],
        sales: null,
      };
    }

    return { status: HttpStatus.OK, errors: null, sales: sales };
  }

  public async getSalesByDate({
    date,
  }: GetSalesByDateDto): Promise<GetSalesByUserResponse> {
    const sales: Sale[] = await this.saleRepository.find({
      where: {
        date: Like(`%${date}%`),
      },
      relations: ['products'],
    });

    if (!sales) {
      return {
        status: HttpStatus.NOT_FOUND,
        errors: [`Sales are not found`],
        sales: null,
      };
    }

    return { status: HttpStatus.OK, errors: null, sales: sales };
  }

  public async createSale({
    userName,
    tableName,
    date,
    tip,
    totalPrice,
    products,
    email,
  }: CreateSaleDto): Promise<CreateSaleResponse> {
    const sale = {
      userName,
      tableName,
      date,
      tip,
      totalPrice,
      products,
    };

    const to = email;
    const subject = 'Comprobante de pedido';

    const productList = products
      .map(
        (product) => `
      <tr>
        <td>${product.productName}</td>
        <td>${product.quantity}</td>
        <td>${product.pricePerUnit}</td>
        <td>${product.totalPrice}</td>
      </tr>
    `,
      )
      .join('');

    const htmlContent = `
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #fff;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            padding: 10px 0;
            border-bottom: 1px solid #ddd;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            color: #333;
          }
          .content {
            margin: 20px 0;
          }
          .content h2 {
            font-size: 18px;
            color: #333;
            margin-bottom: 10px;
          }
          .content p {
            margin: 5px 0;
            font-size: 16px;
            color: #555;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .table th, .table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          .table th {
            background-color: #f4f4f4;
            color: #333;
          }
          .footer {
            text-align: center;
            padding: 10px 0;
            border-top: 1px solid #ddd;
          }
          .footer p {
            margin: 0;
            font-size: 14px;
            color: #777;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Restaurante RESTOCK</h1>
            <p>Comprobante de Pedido</p>
          </div>
          <div class="content">
            <h2>Detalles del Pedido</h2>
            <p><strong>Atendido por:</strong> ${userName}</p>
            <p><strong>Mesa:</strong> ${tableName}</p>
            <p><strong>Fecha:</strong> ${date}</p>
            <p><strong>Propina:</strong> ${tip} (10% del total)</p>
            <h2>Productos</h2>
            <table class="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio (c/u)</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${productList}
              </tbody>
            </table>
            <p><strong>Total de la Orden:</strong> ${totalPrice}</p>
          </div>
          <div class="footer">
            <p>Gracias por su visita. ¡Esperamos verlo pronto!</p>
          </div>
        </div>
      </body>
    `;

    await this.emailService.sendEmail(to, subject, htmlContent);

    await this.saleRepository.save(sale);

    return { status: HttpStatus.CREATED, errors: null };
  }

  public async deleteOrderItem({
    orderId,
    productId,
  }: DeleteOrderItemRequest): Promise<DeleteOrderItemResponse> {
    const order = await this.repository.findOne({
      where: { id: orderId },
      relations: ['items'],
    });

    if (!order) {
      return {
        status: HttpStatus.NOT_FOUND,
        errors: [`Order with ID ${orderId} not found`],
      };
    }

    // Fetch product details
    const findOneRequest: FindOneRequest = { id: productId };
    const findOneResponse = await lastValueFrom(
      this.productService.findOne(findOneRequest),
    );

    if (findOneResponse.status !== HttpStatus.OK) {
      return {
        status: HttpStatus.BAD_REQUEST,
        errors: [`Product with ID ${productId} not found`],
      };
    }

    const product = findOneResponse.data;

    const itemIndex = order.items.findIndex(
      (item) => item.productId === productId,
    );
    if (itemIndex === -1) {
      return {
        status: HttpStatus.NOT_FOUND,
        errors: [`Product with ID ${productId} not found in order`],
      };
    }

    const [item] = order.items.splice(itemIndex, 1);
    await this.itemRepository.remove(item);

    // Update product stock
    const updateProductRequest: UpdateProductRequest = {
      productId: productId,
      product: {
        ...product,
        stock: product.stock + item.quantity, // Add the quantity back to stock
      },
    };

    const updateProductResponse = await lastValueFrom(
      this.productService.updateProduct(updateProductRequest),
    );

    if (updateProductResponse.status !== HttpStatus.OK) {
      return {
        status: updateProductResponse.status,
        errors: [
          `Failed to update product stock: ${updateProductResponse.error}`,
        ],
      };
    }

    order.totalPrice -= item.totalPrice;
    await this.repository.save(order);

    return { status: HttpStatus.OK, errors: null };
  }
}
