import { User } from 'src/shared/domain/entities/user';

export interface UserRepositoryInterface {
  findByEmail(email: string): Promise<User | null>;
  findById(email: string): Promise<User | null>;
  searchUsers(query: string): Promise<User[]>;
  save(user: User): Promise<User>;
}
