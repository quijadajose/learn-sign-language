import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { UserRepositoryInterface } from '../../ports/user.repository.interface/user.repository.interface';
import { User } from 'src/shared/domain/entities/user';
import { UpdateUserPatch } from 'src/auth/domain/dto/update-user/update-user';

export class UpdateUserUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
  ) {}
  async execute(userId: string, patch: UpdateUserPatch): Promise<User> {
    const { email, firstName, lastName, age, passwordHash, isRightHanded } =
      patch;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('errors.user.notFound');
    }

    if (email && email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        throw new BadRequestException('errors.auth.emailInUse');
      }
      user.email = email;
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (age) user.age = age;
    if (isRightHanded !== undefined) user.isRightHanded = isRightHanded;
    if (passwordHash) {
      user.hashPassword = passwordHash;
      user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    }

    return await this.userRepository.save(user);
  }
}
