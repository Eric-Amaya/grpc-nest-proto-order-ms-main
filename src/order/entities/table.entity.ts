import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Order } from "./order.entity";

@Entity()
@Unique(['name'])
export class Table extends BaseEntity{
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column( {type: 'varchar'} )
  public name!: string;

  @Column( {type: 'int'} )
  public quantity: number;

  @Column( {type: 'varchar'} )
  public state: string;

  @OneToMany(() => Order, (order) => order.table)
  public orders?: Order[];

}