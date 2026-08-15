import { User } from 'src/shared/domain/entities/user';

export type UserAuthState = {
  id: string;
  tokenVersion: number;
  role: string;
};

export interface UserRepositoryInterface {
  findByEmail(email: string): Promise<User | null>;
  findById(email: string): Promise<User | null>;
  findAuthStateById(id: string): Promise<UserAuthState | null>;
  searchUsers(query: string): Promise<User[]>;
  save(user: User): Promise<User>;
}
