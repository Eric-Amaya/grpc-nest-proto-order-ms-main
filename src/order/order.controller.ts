import { Controller, Inject } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { CreateOrderRequest, CreateOrderResponse, CreateSaleRequest, CreateSaleResponse, CreateTableRequest, CreateTableResponse, GetAllOrdersRequest, GetAllOrdersResponse, GetAllSalesRequest, GetAllSalesResponse, GetAllTablesRequest, GetAllTablesResponse, GetOrderRequest, GetOrderResponse, GetSalesByDateRequest, GetSalesByDateResponse, GetSalesByUserRequest, GetSalesByUserResponse, GetTablesByNameRequest, GetTablesByNameResponse, GetUserRequest, GetUserResponse, ORDER_SERVICE_NAME, UpdateTableStateRequest, UpdateTableStateResponse } from './proto/order.pb';
import { OrderService } from './order.service';

@Controller()
export class OrderController {
  @Inject(OrderService)
  private readonly service: OrderService;

  @GrpcMethod(ORDER_SERVICE_NAME, 'CreateTable')
  private createTable (payload: CreateTableRequest): Promise <CreateTableResponse> {
    return this.service.createTable(payload);
  }

  @GrpcMethod(ORDER_SERVICE_NAME, 'GetTablesByName')
  private getTablesByName (payload: GetTablesByNameRequest): Promise <GetTablesByNameResponse> {
    return this.service.getTablesByName(payload);
  }

  @GrpcMethod(ORDER_SERVICE_NAME, 'GetAllTables')
  private getAllTables (): Promise <GetAllTablesResponse> {
    return this.service.getAllTables();
  }

  @GrpcMethod(ORDER_SERVICE_NAME, 'UpdateTableState')
  private updateTableState (payload: UpdateTableStateRequest): Promise <UpdateTableStateResponse> {
    return this.service.updateTableState(payload);
  }

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

  @GrpcMethod(ORDER_SERVICE_NAME, 'CreateSale')
  private createSale(payload: CreateSaleRequest): Promise <CreateSaleResponse> {
    return this.service.createSale(payload);
  }

  @GrpcMethod(ORDER_SERVICE_NAME, 'GetAllSales')
  private getAllSales(payload: GetAllSalesRequest): Promise <GetAllSalesResponse> {
    return this.service.getAllSales(payload);
  }

  @GrpcMethod(ORDER_SERVICE_NAME, 'GetSalesByUser')
  private getSalesByUser(payload: GetSalesByUserRequest): Promise <GetSalesByUserResponse> {
    return this.service.getSalesByUser(payload);
  }

  @GrpcMethod(ORDER_SERVICE_NAME, 'GetSalesByDate')
  private getSalesByDate(payload: GetSalesByDateRequest): Promise <GetSalesByDateResponse> {
    return this.service.getSalesByDate(payload);
  }

}
