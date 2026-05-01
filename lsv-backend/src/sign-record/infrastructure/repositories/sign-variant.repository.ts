import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { SignVariant } from '../../../shared/domain/entities/signVariant';
import { SignVariantRepositoryInterface } from '../../domain/ports/sign-variant.repository.interface';

@Injectable()
export class TypeOrmSignVariantRepository implements SignVariantRepositoryInterface {
  constructor(
    @InjectRepository(SignVariant)
    private readonly repository: Repository<SignVariant>,
  ) {}

  async findOne(options: any): Promise<SignVariant | null> {
    return this.repository.findOne(options);
  }

  create(data: DeepPartial<SignVariant>): SignVariant {
    return this.repository.create(data);
  }

  async save(variant: SignVariant): Promise<SignVariant> {
    return this.repository.save(variant);
  }
}
