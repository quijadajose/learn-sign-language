import { Column, Entity, ManyToOne, PrimaryColumn, Relation } from 'typeorm';
import { Country } from './countries.js';

@Entity()
export class Division {
  @PrimaryColumn({ length: 10 }) // ISO-3166-2 code (ej. AF-BDS)
  code: string;

  @Column()
  name: string;

  @ManyToOne(() => Country, (country) => country.divisions, {
    onDelete: 'CASCADE',
  })
  country: Relation<Country>;
}
