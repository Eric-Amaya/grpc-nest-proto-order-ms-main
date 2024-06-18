import { IsArray, IsEmail, IsInt, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderRequest, CreateSaleRequest, CreateTableRequest, GetSalesByDateRequest, GetSalesByUserRequest, GetTablesByNameRequest, UpdateOrderRequest, UpdateTableStateRequest } from './proto/order.pb';


class OrderItemDto {
  @IsInt()
  productId: number;

  @IsInt()
  quantity: number;

  @IsString()
  modifications: string;

  @IsString()
  productName: string;

  @IsInt()
  pricePerUnit: number;

  @IsInt()
  totalPrice: number;
}

export class CreateOrderRequestDto implements CreateOrderRequest {
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsArray()
  products: OrderItemDto[];

  @IsInt()
  userId: number;

  @IsString()
  nameTable: string;

  @IsString()
  @IsEmail()
  email: string;
}

export class CreateTableRequestDto implements CreateTableRequest{
  @IsString()
  name: string;

  @IsInt()
  quantity: number;

  @IsString()
  state: string;

}

export class GetTablesByNameDto implements GetTablesByNameRequest {
  @IsString()
  name: string;
}

export class UpdateTableStateDto implements UpdateTableStateRequest {
  @IsInt()
  id: number;

  @IsInt()
  quantity: number;

  @IsString()
  state: string;

  @IsInt()
  activeOrderId: number;

}

export class CreateSaleDto implements CreateSaleRequest {
  @IsString()
  userName: string;

  @IsString()
  tableName: string;

  @IsString()
  date: string;

  @IsInt()
  tip: number;

  @IsInt()
  totalPrice: number;

  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsArray()
  products: OrderItemDto[]; 

  @IsString()
  @IsEmail()
  email: string;
}

export class GetSalesByUserDto implements GetSalesByUserRequest {
  @IsString()
  userName: string;
}

export class GetSalesByDateDto implements GetSalesByDateRequest {
  @IsString()
  date: string;
}


export class UpdateOrderDto implements UpdateOrderRequest {
  @IsInt()
  orderId: number;

  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsArray()
  products: OrderItemDto[]; 

  @IsInt()
  userId: number;

  @IsString()
  nameTable: string;

  @IsString()
  email: string;
}


