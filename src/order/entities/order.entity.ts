import { BaseEntity, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Table } from "./table.entity";
import { User } from "../proto/order.pb";
import { OrderItem } from "./orderItem.entity";

@Entity()
export class Order extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ type: 'int' })
  public userId: number;

  @ManyToOne(() => Table, (table) => table.orders, { cascade : true, nullable: true } )
  public table: Table;

  @Column({ type: 'int' })
  public totalPrice: number;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  public items: OrderItem[];

  public user?: User;

}