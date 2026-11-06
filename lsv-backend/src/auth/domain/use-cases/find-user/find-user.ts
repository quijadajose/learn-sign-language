import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../../../shared/domain/entities/user.js';
import { UserRepositoryInterface } from '../../ports/user.repository.interface/user.repository.interface.js';

@Injectable()
export class FindUserUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    return user || null;
  }
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    return user || null;
  }
}
