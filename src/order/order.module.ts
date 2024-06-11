import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { OrderController } from './order.controller';
import { Order, OrderItem } from './order.entity';
import { OrderService } from './order.service';
import { AUTH_SERVICE_NAME } from './proto/auth.pb';
import { PRODUCT_SERVICE_NAME } from './proto/product.pb';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    ClientsModule.register([
      {
        name: PRODUCT_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.PRODUCT_SERVICE_URL, // Adjust the URL as necessary
          package: 'product',
          protoPath: join(__dirname, '../../node_modules/grpc-nest-proto/proto/product.proto'),
        },
      },
      {
        name: AUTH_SERVICE_NAME,
        transport: Transport.GRPC,
        options: {
          url: process.env.AUTH_SERVICE_URL, // Adjust the URL as necessary
          package: 'auth',
          protoPath: join(__dirname, '../../node_modules/grpc-nest-proto/proto/auth.proto'),
        },
      },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
