import { Injectable } from '@nestjs/common';
import { Repository, Like } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/shared/domain/entities/user';
import {
  UserAuthState,
  UserRepositoryInterface,
} from 'src/auth/domain/ports/user.repository.interface/user.repository.interface';

@Injectable()
export class UserRepository implements UserRepositoryInterface {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: {
        moderatorPermissions: {
          language: true,
          region: true,
        },
      },
    });
  }

  async findAuthStateById(id: string): Promise<UserAuthState | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: { id: true, tokenVersion: true, role: true },
    });
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      tokenVersion: user.tokenVersion ?? 0,
      role: user.role,
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: {
        moderatorPermissions: {
          language: true,
          region: true,
        },
      },
    });
  }

  async searchUsers(query: string): Promise<User[]> {
    const searchTerm = `%${query}%`;
    return this.userRepository.find({
      where: [
        { email: Like(searchTerm) },
        { firstName: Like(searchTerm) },
        { lastName: Like(searchTerm) },
      ],
      take: 10, // Limitar a 10 resultados
    });
  }

  async save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }
}
