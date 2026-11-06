import { normalizeEmail } from '../../utils/normalize-email.js';
import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { CreateUserDto } from '../../dto/create-user/create-user.js';
import { User } from '../../../../shared/domain/entities/user.js';
import { UserRepositoryInterface } from '../../ports/user.repository.interface/user.repository.interface.js';
import { HashService } from '../../ports/hash.service.interface/hash.service.interface.js';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
    @Inject('HashService')
    private readonly hashService: HashService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<User | null> {
    const { email, firstName, lastName, age, password, isRightHanded, role } =
      createUserDto;

    const existingUser = await this.userRepository.findByEmail(
      normalizeEmail(email),
    );
    if (existingUser) {
      if (password) {
        await this.hashService.hash(password);
      }
      return null;
    }

    const newUser = new User();
    newUser.email = normalizeEmail(email);
    newUser.firstName = firstName;
    newUser.lastName = lastName;
    newUser.age = age;
    newUser.hashPassword = await this.hashService.hash(password);
    newUser.isRightHanded = isRightHanded;
    newUser.role = role;

    return await this.userRepository.save(newUser);
  }
  async registerUserWithOAuth2(createUserDto: CreateUserDto) {
    const { email, firstName, lastName, age, role } = createUserDto;

    const existingUser = await this.userRepository.findByEmail(
      normalizeEmail(email),
    );
    if (existingUser) {
      throw new ConflictException('errors.auth.emailInUse');
    }

    const newUser = new User();
    newUser.email = normalizeEmail(email);
    newUser.firstName = firstName;
    newUser.lastName = lastName;
    newUser.age = age;
    newUser.hashPassword = null;
    newUser.isRightHanded = true;
    newUser.role = role;
    newUser.googleId = createUserDto.googleId;
    newUser.hashPassword = undefined;

    return await this.userRepository.save(newUser);
  }
}
