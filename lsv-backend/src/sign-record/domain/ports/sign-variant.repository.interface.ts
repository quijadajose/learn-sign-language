import { SignVariant } from '../../../shared/domain/entities/signVariant.js';

export interface SignVariantRepositoryInterface {
  findById(id: string): Promise<SignVariant | null>;
  create(data: Partial<SignVariant>): SignVariant;
  save(variant: SignVariant): Promise<SignVariant>;
}
