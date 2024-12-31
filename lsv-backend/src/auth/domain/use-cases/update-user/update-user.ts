import { BadRequestException, Inject, NotFoundException } from "@nestjs/common";
import { UserRepositoryInterface } from "../../ports/user.repository.interface/user.repository.interface.interface";
import { User } from "src/shared/domain/entities/user";
import { UpdateUserDto } from "src/auth/application/dtos/update-user/update-user";

export class UpdateUserUseCase {
    constructor(
        @Inject('UserRepositoryInterface')
        private readonly userRepository: UserRepositoryInterface,
    ) { }
    async execute(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
        const { email, firstName, lastName, age, hashPassword, isRightHanded, role } = updateUserDto;

        // Buscar el usuario por ID
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Validar si el nuevo correo ya está en uso por otro usuario
        if (email && email !== user.email) {
            const existingUser = await this.userRepository.findByEmail(email);
            if (existingUser) {
                throw new BadRequestException('Email already in use');
            }
            user.email = email;
        }

        // Actualizar los campos del usuario
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (age) user.age = age;
        if (hashPassword) user.hashPassword = hashPassword;
        if (isRightHanded !== undefined) user.isRightHanded = isRightHanded;
        if (role) user.role = role;

        // Guardar los cambios en el repositorio
        return await this.userRepository.save(user);
    }
}
