import { Controller, Inject } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import {
  CreateOrderRequest,
  CreateOrderResponse,
  CreateSaleRequest,
  CreateSaleResponse,
  CreateTableRequest,
  CreateTableResponse,
  GetAllOrdersRequest,
  GetAllOrdersResponse,
  GetAllSalesRequest,
  GetAllSalesResponse,
  GetAllTablesRequest,
  GetAllTablesResponse,
  GetOrderRequest,
  GetOrderResponse,
  GetSalesByDateRequest,
  GetSalesByDateResponse,
  GetSalesByUserRequest,
  GetSalesByUserResponse,
  GetTablesByNameRequest,
  GetTablesByNameResponse,
  GetUserRequest,
  GetUserResponse,
  ORDER_SERVICE_NAME,
  UpdateTableStateRequest,
  UpdateTableStateResponse,
  DeleteOrderItemRequest,
  DeleteOrderItemResponse,
  UpdateOrderRequest,
  UpdateOrderResponse,
} from './proto/order.pb';
import { OrderService } from './order.service';

@Controller()
export class OrderController {
  @Inject(OrderService)
  private readonly service: OrderService;

  @GrpcMethod(ORDER_SERVICE_NAME, 'CreateTable')
  public createTable(
    payload: CreateTableRequest,
  ): Promise<CreateTableResponse> {
    return this.service.createTable(payload);
  }

  @GrpcMethod(ORDER_SERVICE_NAME, 'GetTablesByName')
  public getTablesByName(
    payload: GetTablesByNameRequest,
  ): Promise<GetTablesByNameResponse> {
    return this.service.getTablesByName(payload);
  }

  @GrpcMethod(ORDER_SERVICE_NAME, 'GetAllTables')
  public getAllTables(): Promise<GetAllTablesResponse> {
    return this.service.getAllTables();
  }

  @GrpcMethod(ORDER_SERVICE_NAME, 'UpdateTableState')
  public updateTableState(
    payload: UpdateTableStateRequest,
  ): Promise<UpdateTableStateResponse> {
    return this.service.updateTableState(payload);
  }

  @GrpcMethod(ORDER_SERVICE_NAME, 'CreateOrder')
  public createOrder(
    payload: CreateOrderRequest,
  ): Promise<CreateOrderResponse> {
    return this.service.createOrder(payload);
  }

  @GrpcMethod(ORDER_SERVICE_NAME, 'GetUser')
  public getUser(payload: GetUserRequest): Promise<GetUserResponse> {
    return this.service.getUser(payload);
  }

  @GrpcMethod(ORDER_SERVICE_NAME, 'GetAllOrders')
  public getAllOrders(
    payload: GetAllOrdersRequest,
  ): Promise<GetAllOrdersResponse> {
    return this.service.getAllOrders(payload);
  }

  @GrpcMethod(ORDER_SERVICE_NAME, 'GetOrder')
  public getOrder(payload: GetOrderRequest): Promise<GetOrderResponse> {
    return this.service.getOrder(payload);
  }

  @GrpcMethod(ORDER_SERVICE_NAME, 'CreateSale')
  public createSale(payload: CreateSaleRequest): Promise<CreateSaleResponse> {
    return this.service.createSale(payload);
  }

  @GrpcMethod(ORDER_SERVICE_NAME, 'GetAllSales')
  public getAllSales(
    payload: GetAllSalesRequest,
  ): Promise<GetAllSalesResponse> {
    return this.service.getAllSales(payload);
  }

  @GrpcMethod(ORDER_SERVICE_NAME, 'GetSalesByUser')
  public getSalesByUser(
    payload: GetSalesByUserRequest,
  ): Promise<GetSalesByUserResponse> {
    return this.service.getSalesByUser(payload);
  }

  @GrpcMethod(ORDER_SERVICE_NAME, 'GetSalesByDate')
  public getSalesByDate(
    payload: GetSalesByDateRequest,
  ): Promise<GetSalesByDateResponse> {
    return this.service.getSalesByDate(payload);
  }

  @GrpcMethod(ORDER_SERVICE_NAME, 'DeleteOrderItem')
  public deleteOrderItem(
    payload: DeleteOrderItemRequest,
  ): Promise<DeleteOrderItemResponse> {
    return this.service.deleteOrderItem(payload);
  }

  @GrpcMethod(ORDER_SERVICE_NAME, 'UpdateOrder')
  public updateOrder(
    payload: UpdateOrderRequest,
  ): Promise<UpdateOrderResponse> {
    return this.service.updateOrder(payload);
  }
}
