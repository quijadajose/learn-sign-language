import { Injectable } from '@nestjs/common';
import { Repository, ILike } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../../../shared/domain/entities/user.js';
import {
  UserAuthState,
  UserRepositoryInterface,
} from '../../../domain/ports/user.repository.interface/user.repository.interface.js';

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
          // FE-04: el cliente necesita las regiones de cada idioma para resolver permisos de región.
          language: { regions: true },
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
          // FE-04: el cliente necesita las regiones de cada idioma para resolver permisos de región.
          language: { regions: true },
          region: true,
        },
      },
    });
  }

  async searchUsers(query: string): Promise<User[]> {
    // BE-31: sin distinguir mayúsculas y con los comodines de LIKE escapados.
    const escaped = query.replace(/[\\%_]/g, (c) => `\\${c}`);
    const searchTerm = `%${escaped}%`;
    return this.userRepository.find({
      where: [
        { email: ILike(searchTerm) },
        { firstName: ILike(searchTerm) },
        { lastName: ILike(searchTerm) },
      ],
      take: 10, // Limitar a 10 resultados
    });
  }

  async save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }
}
