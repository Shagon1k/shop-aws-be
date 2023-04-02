import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text'})
  title: string;

  @Column({ type: 'text'})
  description: string;

  @Column({ type: 'integer'})
  price: number;
}
