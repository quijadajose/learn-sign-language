import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Division } from './divisions';

@Entity()
export class Country {
  @PrimaryColumn({ length: 2 }) // Código ISO-3166-1 alfa-2 (ej. AF, AL)
  code: string;

  @Column()
  name: string;

  @OneToMany(() => Division, (division) => division.country)
  divisions: Division[];
}
