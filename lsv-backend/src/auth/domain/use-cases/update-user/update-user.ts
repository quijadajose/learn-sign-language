import { BadRequestException, Inject, NotFoundException } from '@nestjs/common';
import { UserRepositoryInterface } from '../../ports/user.repository.interface/user.repository.interface.js';
import { User } from '../../../../shared/domain/entities/user.js';
import { UpdateUserPatch } from '../../dto/update-user/update-user.js';
import { normalizeEmail } from '../../utils/normalize-email.js';

export class UpdateUserUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
  ) {}
  async execute(userId: string, patch: UpdateUserPatch): Promise<User> {
    const {
      email,
      firstName,
      lastName,
      age,
      passwordHash,
      isRightHanded,
      revokeSessions,
    } = patch;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('errors.user.notFound');
    }

    const normalizedEmail = email ? normalizeEmail(email) : undefined;
    if (normalizedEmail && normalizedEmail !== user.email) {
      const existingUser =
        await this.userRepository.findByEmail(normalizedEmail);
      if (existingUser) {
        throw new BadRequestException('errors.auth.emailInUse');
      }
      user.email = normalizedEmail;
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (age) user.age = age;
    if (isRightHanded !== undefined) user.isRightHanded = isRightHanded;
    if (passwordHash) {
      user.hashPassword = passwordHash;
      user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    } else if (revokeSessions) {
      user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    }

    return await this.userRepository.save(user);
  }
}
