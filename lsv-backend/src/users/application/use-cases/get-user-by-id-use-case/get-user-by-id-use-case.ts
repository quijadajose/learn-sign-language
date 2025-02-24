import { Inject } from '@nestjs/common';
import { UserRepository } from 'src/auth/infrastructure/typeorm/user.repository/user.repository';
import { User } from 'src/shared/domain/entities/user';

export class GetUserByIdUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }
}
