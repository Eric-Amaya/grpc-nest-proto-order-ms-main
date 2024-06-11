import { IsArray, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderRequest } from './proto/order.pb';

class OrderItemDto {
  @IsInt()
  productId: number;

  @IsInt()
  quantity: number;
}

export class CreateOrderRequestDto implements CreateOrderRequest {
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsArray()
  products: OrderItemDto[];

  @IsInt()
  userId: number;

  @IsInt()
  tableNumber: number;
}
