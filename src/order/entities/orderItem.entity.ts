import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./order.entity";
import { Sale } from "./sale.entity";


@Entity()
export class OrderItem extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ type: 'int' })
  public productId: number;

  @Column({ type: 'int' })
  public quantity: number;

  @ManyToOne(() => Order, (order) => order.items)
  public order: Order;

  @ManyToOne(() => Sale, (sale) => sale.orders)
  public sale: Sale;
}