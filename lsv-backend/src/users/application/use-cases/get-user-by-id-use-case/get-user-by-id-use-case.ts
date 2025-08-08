import { Inject } from '@nestjs/common';
import { UserRepositoryInterface } from 'src/auth/domain/ports/user.repository.interface/user.repository.interface.interface';
import { User } from 'src/shared/domain/entities/user';

export class GetUserByIdUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  async execute(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }
}
