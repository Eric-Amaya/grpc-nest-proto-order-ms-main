import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from '../order.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClientGrpc } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import { of } from 'rxjs';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/orderItem.entity';
import { Table } from '../entities/table.entity';
import { Sale } from '../entities/sale.entity';
import { EmailService } from '../extra/send_email';
import {
  ProductServiceClient,
  PRODUCT_SERVICE_NAME,
} from '../proto/product.pb';
import { AuthServiceClient, AUTH_SERVICE_NAME } from '../proto/auth.pb';
import {
  CreateOrderResponse,
  CreateTableResponse,
  GetAllTablesResponse,
  GetOrderResponse,
  UpdateTableStateResponse,
  UpdateOrderResponse,
  GetAllOrdersResponse,
  GetUserResponse,
  GetAllSalesResponse,
  GetSalesByUserResponse,
  GetSalesByDateResponse,
  CreateSaleResponse,
  DeleteOrderItemResponse,
} from '../proto/order.pb';

describe('OrderService', () => {
  let service: OrderService;
  let orderRepository: Repository<Order>;
  let orderItemRepository: Repository<OrderItem>;
  let tableRepository: Repository<Table>;
  let saleRepository: Repository<Sale>;
  let productClient: ClientGrpc;
  let userClient: ClientGrpc;
  let emailService: EmailService;
  let productService: ProductServiceClient;
  let userService: AuthServiceClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(OrderItem),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Table),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Sale),
          useClass: Repository,
        },
        {
          provide: EmailService,
          useValue: {
            sendEmail: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: PRODUCT_SERVICE_NAME,
          useValue: {
            getService: jest.fn().mockReturnValue({
              findOne: jest.fn(),
              updateProduct: jest.fn(),
            }),
          },
        },
        {
          provide: AUTH_SERVICE_NAME,
          useValue: {
            getService: jest.fn().mockReturnValue({
              getUser: jest.fn(),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    orderRepository = module.get<Repository<Order>>(getRepositoryToken(Order));
    orderItemRepository = module.get<Repository<OrderItem>>(
      getRepositoryToken(OrderItem),
    );
    tableRepository = module.get<Repository<Table>>(getRepositoryToken(Table));
    saleRepository = module.get<Repository<Sale>>(getRepositoryToken(Sale));
    productClient = module.get<ClientGrpc>(PRODUCT_SERVICE_NAME);
    userClient = module.get<ClientGrpc>(AUTH_SERVICE_NAME);
    emailService = module.get<EmailService>(EmailService);
    productService =
      productClient.getService<ProductServiceClient>(PRODUCT_SERVICE_NAME);
    userService = userClient.getService<AuthServiceClient>(AUTH_SERVICE_NAME);

    service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a table', async () => {
    const table = { name: 'Table 1', quantity: 4, state: 'available' };
    const createTableResponse: CreateTableResponse = {
      status: 201,
      errors: null,
    };
    jest.spyOn(tableRepository, 'save').mockResolvedValue(table as any);

    const result = await service.createTable(table);

    expect(result).toStrictEqual(createTableResponse);
    expect(tableRepository.save).toHaveBeenCalledWith(table);
  });

  it('should get tables by name', async () => {
    const table = {
      id: 1,
      name: 'Table 1',
      quantity: 4,
      state: 'available',
      activeOrderId: 1,
    };
    jest.spyOn(tableRepository, 'findOne').mockResolvedValue(table as any);

    const result = await service.getTablesByName({ name: 'Table 1' });

    expect(result).toStrictEqual({
      status: 200,
      errors: null,
      table,
    });
    expect(tableRepository.findOne).toHaveBeenCalledWith({
      where: { name: 'Table 1' },
    });
  });

  it('should get all tables', async () => {
    const tables = [
      {
        id: 1,
        name: 'Table 1',
        quantity: 4,
        state: 'available',
        activeOrderId: 1,
      },
    ];
    jest.spyOn(tableRepository, 'find').mockResolvedValue(tables as any);

    const result = await service.getAllTables();

    expect(result).toStrictEqual({
      status: 200,
      errors: null,
      tables,
    });
    expect(tableRepository.find).toHaveBeenCalled();
  });

  it('should update table state', async () => {
    const table = {
      id: 1,
      name: 'Table 1',
      quantity: 4,
      state: 'available',
      activeOrderId: 1,
    };
    jest.spyOn(tableRepository, 'findOne').mockResolvedValue(table as any);
    jest.spyOn(tableRepository, 'save').mockResolvedValue(table as any);

    const payload = { id: 1, quantity: 4, state: 'occupied', activeOrderId: 1 };
    const result = await service.updateTableState(payload);

    expect(result).toStrictEqual({ status: 200, errors: null });
    expect(tableRepository.save).toHaveBeenCalled();
  });

  it('should create an order', async () => {
    const createOrderRequest = {
      products: [
        {
          productId: 1,
          quantity: 2,
          modifications: '',
          productName: 'Product 1',
          pricePerUnit: 10,
          totalPrice: 20,
        },
      ],
      userId: 1,
      nameTable: 'Table 1',
      email: 'test@example.com',
    };
    const order = new Order();
    order.id = 1;
    order.userId = 1;
    order.email = 'test@example.com';
    order.items = [];
    order.totalPrice = 20;

    const userResponse = { status: 200, user: { id: 1, name: 'Test User' } };
    jest.spyOn(userService, 'getUser').mockReturnValue(of(userResponse) as any);

    const productResponse = {
      status: 200,
      data: { id: 1, name: 'Product 1', price: 10 },
    };
    jest
      .spyOn(productService, 'findOne')
      .mockReturnValue(of(productResponse) as any);

    jest
      .spyOn(orderRepository, 'save')
      .mockImplementation(async (order: Order) => {
        order.id = 1; // Ensure the id is set
        return order;
      });
    jest.spyOn(tableRepository, 'findOne').mockResolvedValue({} as any);

    const result = await service.createOrder(createOrderRequest);

    expect(result).toStrictEqual({ status: 201, errors: null, id: order.id });
  });

  it('should get an order', async () => {
    const order = new Order();
    order.id = 1;
    order.userId = 1;
    order.email = 'test@example.com';
    order.items = [];
    order.totalPrice = 20;

    const userResponse = { status: 200, user: { id: 1, name: 'Test User' } };
    jest.spyOn(userService, 'getUser').mockReturnValue(of(userResponse) as any);

    jest.spyOn(orderRepository, 'findOne').mockResolvedValue(order as any);

    const result = await service.getOrder({ orderId: 1 });

    expect(result.status).toBe(200);
    expect(result.errors).toBe(null);
    expect(result.order).toHaveProperty('id', 1);
    expect(result.order).toHaveProperty('user', { id: 1, name: 'Test User' });
  });

  it('should get all orders', async () => {
    const orders = [new Order()];
    orders[0].id = 1;
    orders[0].userId = 1;
    orders[0].email = 'test@example.com';
    orders[0].items = [];
    orders[0].totalPrice = 20;

    const userResponse = { status: 200, user: { id: 1, name: 'Test User' } };
    jest.spyOn(userService, 'getUser').mockReturnValue(of(userResponse) as any);

    jest.spyOn(orderRepository, 'find').mockResolvedValue(orders as any);

    const result = await service.getAllOrders({});

    expect(result.status).toBe(200);
    expect(result.errors).toBe(null);
    expect(result.orders[0]).toHaveProperty('id', 1);
    expect(result.orders[0]).toHaveProperty('user', {
      id: 1,
      name: 'Test User',
    });
  });

  it('should get a user', async () => {
    const userResponse = { status: 200, user: { id: 1, name: 'Test User' } };
    jest.spyOn(userService, 'getUser').mockReturnValue(of(userResponse) as any);

    const result = await service.getUser({ userId: 1 });

    expect(result.status).toBe(200);
    expect(result.errors).toBe(null);
    expect(result.user).toStrictEqual({ id: 1, name: 'Test User' });
  });

  it('should get all sales', async () => {
    const sales = [new Sale()];
    sales[0].id = 1;
    sales[0].userName = 'Test User';
    sales[0].tableName = 'Table 1';
    sales[0].date = '2023-01-01';
    sales[0].tip = 100;
    sales[0].totalPrice = 1000;
    sales[0].products = [];

    jest.spyOn(saleRepository, 'find').mockResolvedValue(sales as any);

    const result = await service.getAllSales({});

    expect(result.status).toBe(200);
    expect(result.errors).toBe(null);
    expect(result.sales[0]).toHaveProperty('id', 1);
  });

  it('should get sales by user', async () => {
    const sales = [new Sale()];
    sales[0].id = 1;
    sales[0].userName = 'Test User';
    sales[0].tableName = 'Table 1';
    sales[0].date = '2023-01-01';
    sales[0].tip = 100;
    sales[0].totalPrice = 1000;
    sales[0].products = [];

    jest.spyOn(saleRepository, 'find').mockResolvedValue(sales as any);

    const result = await service.getSalesByUser({ userName: 'Test User' });

    expect(result.status).toBe(200);
    expect(result.errors).toBe(null);
    expect(result.sales[0]).toHaveProperty('id', 1);
  });

  it('should get sales by date', async () => {
    const sales = [new Sale()];
    sales[0].id = 1;
    sales[0].userName = 'Test User';
    sales[0].tableName = 'Table 1';
    sales[0].date = '2023-01-01';
    sales[0].tip = 100;
    sales[0].totalPrice = 1000;
    sales[0].products = [];

    jest.spyOn(saleRepository, 'find').mockResolvedValue(sales as any);

    const result = await service.getSalesByDate({ date: '2023-01-01' });

    expect(result.status).toBe(200);
    expect(result.errors).toBe(null);
    expect(result.sales[0]).toHaveProperty('id', 1);
  });

  it('should delete an order item', async () => {
    const order = new Order();
    order.id = 1;
    order.userId = 1;
    order.email = 'test@example.com';
    order.items = [{ productId: 1, quantity: 2, totalPrice: 20 }] as any;
    order.totalPrice = 20;

    const productResponse = {
      status: 200,
      data: { id: 1, name: 'Product 1', price: 10, stock: 10 },
    };
    jest
      .spyOn(productService, 'findOne')
      .mockReturnValue(of(productResponse) as any);
    jest
      .spyOn(productService, 'updateProduct')
      .mockReturnValue(of({ status: 200 }) as any);

    jest.spyOn(orderRepository, 'findOne').mockResolvedValue(order as any);
    jest.spyOn(orderItemRepository, 'remove').mockResolvedValue({} as any);
    jest.spyOn(orderRepository, 'save').mockResolvedValue(order as any);

    const result = await service.deleteOrderItem({ orderId: 1, productId: 1 });

    expect(result).toStrictEqual({ status: 200, errors: null });
  });
});
