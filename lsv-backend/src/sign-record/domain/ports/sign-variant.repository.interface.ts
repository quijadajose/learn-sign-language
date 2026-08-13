import { SignVariant } from 'src/shared/domain/entities/signVariant';

export interface SignVariantRepositoryInterface {
  findById(id: string): Promise<SignVariant | null>;
  create(data: Partial<SignVariant>): SignVariant;
  save(variant: SignVariant): Promise<SignVariant>;
}
