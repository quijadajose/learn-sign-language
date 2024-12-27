import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { CreateUserDto } from 'src/auth/application/dtos/create-user/create-user';
import { User } from 'src/shared/domain/entities/user';
import { UserRepositoryInterface } from '../../ports/user.repository.interface/user.repository.interface.interface';
import { HashService } from '../../ports/hash.service.interface/hash.service.interface';

@Injectable()
export class RegisterUserUseCase {
    constructor(
        @Inject('UserRepositoryInterface')
        private readonly userRepository: UserRepositoryInterface,
        @Inject('HashService')
        private readonly hashService: HashService,

    ) { }

    async execute(createUserDto: CreateUserDto): Promise<User> {
        const { email, firstName, lastName, age, password, isRightHanded, role } = createUserDto;

        // Validar si el correo ya existe
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new BadRequestException('Email already in use');
        }

        // Crear instancia del usuario
        const newUser = new User();
        newUser.email = email;
        newUser.firstName = firstName;
        newUser.lastName = lastName;
        newUser.age = age;
        newUser.hashPassword = await this.hashService.hash(password);
        newUser.isRightHanded = isRightHanded;
        newUser.role = role;

        // Guardar usuario en el repositorio
        return await this.userRepository.save(newUser);
    }
}
