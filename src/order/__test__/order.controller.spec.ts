import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from '../order.controller';
import { OrderService } from '../order.service';
import {
  CreateTableRequest,
  CreateTableResponse,
  GetTablesByNameRequest,
  GetTablesByNameResponse,
  GetAllTablesResponse,
  UpdateTableStateRequest,
  UpdateTableStateResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  GetUserRequest,
  GetUserResponse,
  GetAllOrdersRequest,
  GetAllOrdersResponse,
  GetOrderRequest,
  GetOrderResponse,
  CreateSaleRequest,
  CreateSaleResponse,
  GetAllSalesRequest,
  GetAllSalesResponse,
  GetSalesByUserRequest,
  GetSalesByUserResponse,
  GetSalesByDateRequest,
  GetSalesByDateResponse,
  DeleteOrderItemRequest,
  DeleteOrderItemResponse,
  UpdateOrderRequest,
  UpdateOrderResponse,
} from '../proto/order.pb';

describe('OrderController', () => {
  let orderController: OrderController;
  let orderService: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: {
            createTable: jest.fn(),
            getTablesByName: jest.fn(),
            getAllTables: jest.fn(),
            updateTableState: jest.fn(),
            createOrder: jest.fn(),
            getUser: jest.fn(),
            getAllOrders: jest.fn(),
            getOrder: jest.fn(),
            createSale: jest.fn(),
            getAllSales: jest.fn(),
            getSalesByUser: jest.fn(),
            getSalesByDate: jest.fn(),
            deleteOrderItem: jest.fn(),
            updateOrder: jest.fn(),
          },
        },
      ],
    }).compile();

    orderController = module.get<OrderController>(OrderController);
    orderService = module.get<OrderService>(OrderService);
  });

  test('should be defined', () => {
    expect(orderController).toBeDefined();
  });

  test('should call createTable method', async () => {
    const payload: CreateTableRequest = {
      name: 'Table 1',
      quantity: 4,
      state: 'available',
    };
    const expectedResult: CreateTableResponse = {
      status: 201,
      errors: [],
    };

    jest.spyOn(orderService, 'createTable').mockResolvedValue(expectedResult);

    expect(await orderController.createTable(payload)).toBe(expectedResult);
  });

  test('should call getTablesByName method', async () => {
    const payload: GetTablesByNameRequest = { name: 'Table 1' };
    const expectedResult: GetTablesByNameResponse = {
      status: 200,
      errors: [],
      table: {
        id: 1,
        name: 'Table 1',
        quantity: 4,
        state: 'available',
        activeOrderId: 0,
      },
    };

    jest
      .spyOn(orderService, 'getTablesByName')
      .mockResolvedValue(expectedResult);

    expect(await orderController.getTablesByName(payload)).toBe(expectedResult);
  });

  test('should call getAllTables method', async () => {
    const expectedResult: GetAllTablesResponse = {
      status: 200,
      errors: [],
      tables: [
        {
          id: 1,
          name: 'Table 1',
          quantity: 4,
          state: 'available',
          activeOrderId: 0,
        },
      ],
    };

    jest.spyOn(orderService, 'getAllTables').mockResolvedValue(expectedResult);

    expect(await orderController.getAllTables()).toBe(expectedResult);
  });

  test('should call updateTableState method', async () => {
    const payload: UpdateTableStateRequest = {
      id: 1,
      quantity: 4,
      state: 'occupied',
      activeOrderId: 1,
    };
    const expectedResult: UpdateTableStateResponse = {
      status: 200,
      errors: [],
    };

    jest
      .spyOn(orderService, 'updateTableState')
      .mockResolvedValue(expectedResult);

    expect(await orderController.updateTableState(payload)).toBe(
      expectedResult,
    );
  });

  test('should call createOrder method', async () => {
    const payload: CreateOrderRequest = {
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
    const expectedResult: CreateOrderResponse = {
      status: 201,
      errors: [],
      id: 1,
    };

    jest.spyOn(orderService, 'createOrder').mockResolvedValue(expectedResult);

    expect(await orderController.createOrder(payload)).toBe(expectedResult);
  });

  test('should call getUser method', async () => {
    const payload: GetUserRequest = { userId: 1 };
    const expectedResult: GetUserResponse = {
      status: 200,
      errors: [],
      user: { id: 1, email: 'test@test.com', role: 'admin', name: 'test' },
    };

    jest.spyOn(orderService, 'getUser').mockResolvedValue(expectedResult);

    expect(await orderController.getUser(payload)).toBe(expectedResult);
  });

  test('should call getAllOrders method', async () => {
    const payload: GetAllOrdersRequest = {};
    const expectedResult: GetAllOrdersResponse = {
      status: 200,
      errors: [],
      orders: [
        {
          id: 1,
          userId: 1,
          table: {
            id: 1,
            name: 'Table 1',
            quantity: 4,
            state: 'available',
            activeOrderId: 0,
          },
          totalPrice: 20,
          items: [
            {
              productId: 1,
              quantity: 2,
              modifications: '',
              productName: 'Product 1',
              pricePerUnit: 10,
              totalPrice: 20,
            },
          ],
          user: { id: 1, email: 'test@test.com', role: 'admin', name: 'test' },
          email: 'test@example.com',
        },
      ],
    };

    jest.spyOn(orderService, 'getAllOrders').mockResolvedValue(expectedResult);

    expect(await orderController.getAllOrders(payload)).toBe(expectedResult);
  });

  test('should call getOrder method', async () => {
    const payload: GetOrderRequest = { orderId: 1 };
    const expectedResult: GetOrderResponse = {
      status: 200,
      errors: [],
      order: {
        id: 1,
        userId: 1,
        table: {
          id: 1,
          name: 'Table 1',
          quantity: 4,
          state: 'available',
          activeOrderId: 0,
        },
        totalPrice: 20,
        items: [
          {
            productId: 1,
            quantity: 2,
            modifications: '',
            productName: 'Product 1',
            pricePerUnit: 10,
            totalPrice: 20,
          },
        ],
        user: { id: 1, email: 'test@test.com', role: 'admin', name: 'test' },
        email: 'test@example.com',
      },
    };

    jest.spyOn(orderService, 'getOrder').mockResolvedValue(expectedResult);

    expect(await orderController.getOrder(payload)).toBe(expectedResult);
  });

  test('should call createSale method', async () => {
    const payload: CreateSaleRequest = {
      userName: 'test',
      tableName: 'Table 1',
      date: '2023-01-01',
      tip: 5,
      totalPrice: 25,
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
      email: 'test@example.com',
    };
    const expectedResult: CreateSaleResponse = { status: 201, errors: [] };

    jest.spyOn(orderService, 'createSale').mockResolvedValue(expectedResult);

    expect(await orderController.createSale(payload)).toBe(expectedResult);
  });

  test('should call getAllSales method', async () => {
    const payload: GetAllSalesRequest = {};
    const expectedResult: GetAllSalesResponse = {
      status: 200,
      errors: [],
      sales: [
        {
          id: 1,
          userName: 'test',
          tableName: 'Table 1',
          date: '2023-01-01',
          tip: 5,
          totalPrice: 25,
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
        },
      ],
    };

    jest.spyOn(orderService, 'getAllSales').mockResolvedValue(expectedResult);

    expect(await orderController.getAllSales(payload)).toBe(expectedResult);
  });

  test('should call getSalesByUser method', async () => {
    const payload: GetSalesByUserRequest = { userName: 'test' };
    const expectedResult: GetSalesByUserResponse = {
      status: 200,
      errors: [],
      sales: [
        {
          id: 1,
          userName: 'test',
          tableName: 'Table 1',
          date: '2023-01-01',
          tip: 5,
          totalPrice: 25,
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
        },
      ],
    };

    jest
      .spyOn(orderService, 'getSalesByUser')
      .mockResolvedValue(expectedResult);

    expect(await orderController.getSalesByUser(payload)).toBe(expectedResult);
  });

  test('should call getSalesByDate method', async () => {
    const payload: GetSalesByDateRequest = { date: '2023-01-01' };
    const expectedResult: GetSalesByDateResponse = {
      status: 200,
      errors: [],
      sales: [
        {
          id: 1,
          userName: 'test',
          tableName: 'Table 1',
          date: '2023-01-01',
          tip: 5,
          totalPrice: 25,
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
        },
      ],
    };

    jest
      .spyOn(orderService, 'getSalesByDate')
      .mockResolvedValue(expectedResult);

    expect(await orderController.getSalesByDate(payload)).toBe(expectedResult);
  });

  test('should call deleteOrderItem method', async () => {
    const payload: DeleteOrderItemRequest = { orderId: 1, productId: 1 };
    const expectedResult: DeleteOrderItemResponse = { status: 200, errors: [] };

    jest
      .spyOn(orderService, 'deleteOrderItem')
      .mockResolvedValue(expectedResult);

    expect(await orderController.deleteOrderItem(payload)).toBe(expectedResult);
  });

  test('should call updateOrder method', async () => {
    const payload: UpdateOrderRequest = {
      orderId: 1,
      products: [
        {
          productId: 1,
          quantity: 3,
          modifications: '',
          productName: 'Product 1',
          pricePerUnit: 10,
          totalPrice: 30,
        },
      ],
      userId: 1,
      nameTable: 'Table 1',
      email: 'test@example.com',
    };
    const expectedResult: UpdateOrderResponse = { status: 200, errors: [] };

    jest.spyOn(orderService, 'updateOrder').mockResolvedValue(expectedResult);

    expect(await orderController.updateOrder(payload)).toBe(expectedResult);
  });
});
