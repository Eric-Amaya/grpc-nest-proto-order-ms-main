import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { AUTH_SERVICE_NAME } from './proto/auth.pb';
import { PRODUCT_SERVICE_NAME } from './proto/product.pb';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/orderItem.entity';
import { Table } from './entities/table.entity';
import { Sale } from './entities/sale.entity';
import { EmailService } from './extra/send_email';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Table, Sale]),
    ClientsModule.register([
      {
        name: PRODUCT_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.PRODUCT_SERVICE_URL, 
          package: 'product',
          protoPath: join(__dirname, '../../node_modules/grpc-nest-proto/proto/product.proto'),
        },
      },
      {
        name: AUTH_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.AUTH_SERVICE_URL, 
          package: 'auth',
          protoPath: join(__dirname, '../../node_modules/grpc-nest-proto/proto/auth.proto'),
        },
      },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService, EmailService],
  exports: [EmailService]
})
export class OrderModule {}
