import { Controller, Inject } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CreateOrderRequest, CreateOrderResponse, GetAllOrdersRequest, GetAllOrdersResponse, GetOrderRequest, GetOrderResponse, GetUserRequest, GetUserResponse, ORDER_SERVICE_NAME } from './proto/order.pb';
import { OrderService } from './order.service';

@Controller()
export class OrderController {
  @Inject(OrderService)
  private readonly service: OrderService;

  @GrpcMethod(ORDER_SERVICE_NAME, 'CreateOrder')
  private createOrder(payload: CreateOrderRequest): Promise<CreateOrderResponse> {
    return this.service.createOrder(payload);
  }

  @GrpcMethod(ORDER_SERVICE_NAME, 'GetUser')
  private getUser(payload: GetUserRequest): Promise<GetUserResponse> {
    return this.service.getUser(payload);
  }

  @GrpcMethod(ORDER_SERVICE_NAME, 'GetAllOrders')
  private getAllOrders(payload: GetAllOrdersRequest): Promise<GetAllOrdersResponse> {
    return this.service.getAllOrders(payload);
  }

  @GrpcMethod(ORDER_SERVICE_NAME, 'GetOrder')
  private getOrder(payload: GetOrderRequest): Promise<GetOrderResponse> {
    return this.service.getOrder(payload);
  }
}
