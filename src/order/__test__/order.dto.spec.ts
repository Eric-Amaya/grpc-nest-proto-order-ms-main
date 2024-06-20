import 'reflect-metadata';
import { validate } from 'class-validator';
import {
  CreateOrderRequestDto,
  CreateTableRequestDto,
  GetTablesByNameDto,
  UpdateTableStateDto,
  CreateSaleDto,
  GetSalesByUserDto,
  GetSalesByDateDto,
  UpdateOrderDto,
} from '../order.dto';

describe('Order DTOs', () => {
  it('should validate CreateOrderRequestDto', async () => {
    const dto = new CreateOrderRequestDto();
    dto.products = [
      {
        productId: 1,
        quantity: 2,
        modifications: '',
        productName: 'Product 1',
        pricePerUnit: 10,
        totalPrice: 20,
      },
    ];
    dto.userId = 1;
    dto.nameTable = 'Table 1';
    dto.email = 'test@example.com';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should invalidate CreateOrderRequestDto with incorrect email', async () => {
    const dto = new CreateOrderRequestDto();
    dto.products = [
      {
        productId: 1,
        quantity: 2,
        modifications: '',
        productName: 'Product 1',
        pricePerUnit: 10,
        totalPrice: 20,
      },
    ];
    dto.userId = 1;
    dto.nameTable = 'Table 1';
    dto.email = 'invalid-email';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('should validate CreateTableRequestDto', async () => {
    const dto = new CreateTableRequestDto();
    dto.name = 'Table 1';
    dto.quantity = 4;
    dto.state = 'available';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate GetTablesByNameDto', async () => {
    const dto = new GetTablesByNameDto();
    dto.name = 'Table 1';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate UpdateTableStateDto', async () => {
    const dto = new UpdateTableStateDto();
    dto.id = 1;
    dto.quantity = 4;
    dto.state = 'occupied';
    dto.activeOrderId = 1;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate CreateSaleDto', async () => {
    const dto = new CreateSaleDto();
    dto.userName = 'test';
    dto.tableName = 'Table 1';
    dto.date = '2023-01-01';
    dto.tip = 5;
    dto.totalPrice = 25;
    dto.products = [
      {
        productId: 1,
        quantity: 2,
        modifications: '',
        productName: 'Product 1',
        pricePerUnit: 10,
        totalPrice: 20,
      },
    ];
    dto.email = 'test@example.com';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate GetSalesByUserDto', async () => {
    const dto = new GetSalesByUserDto();
    dto.userName = 'test';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate GetSalesByDateDto', async () => {
    const dto = new GetSalesByDateDto();
    dto.date = '2023-01-01';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate UpdateOrderDto', async () => {
    const dto = new UpdateOrderDto();
    dto.orderId = 1;
    dto.products = [
      {
        productId: 1,
        quantity: 3,
        modifications: '',
        productName: 'Product 1',
        pricePerUnit: 10,
        totalPrice: 30,
      },
    ];
    dto.userId = 1;
    dto.nameTable = 'Table 1';
    dto.email = 'test@example.com';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
