import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './proto/order.pb';

@Entity()
export class Order extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ type: 'int' })
  public userId: number;

  @Column({ type: 'int' })
  public tableNumber: number;

  @Column({ type: 'int' })
  public totalPrice: number;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  public items: OrderItem[];

  public user?: User;
}

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
}
