import { BaseEntity, Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { OrderItem } from './orderItem.entity';

@Entity()
export class Sale extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column( {type: 'varchar'} )
  public userName: string;

  @Column( {type: 'varchar'} )
  public tableName: string;

  @Column( {type: 'varchar'} )
  public date: string;

  @Column( {type: 'int'} )
  public tip: number;

  @Column( {type: 'int'})
  public totalPrice: number;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.sale, { cascade: true })
  public products: OrderItem[];
}