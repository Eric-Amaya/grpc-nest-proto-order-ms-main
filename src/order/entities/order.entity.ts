import { BaseEntity, Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Table } from "./table.entity";
import { User } from "../proto/order.pb";
import { OrderItem } from "./orderItem.entity";

@Entity()
export class Order extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ type: 'int' })
  public userId: number;

  @OneToOne(() => Table, (table) => table.order, { cascade : true, eager: true } )
  public table: Table;

  @Column({ type: 'int' })
  public totalPrice: number;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true, eager: true })
  public items: OrderItem[];

  public user?: User;

}