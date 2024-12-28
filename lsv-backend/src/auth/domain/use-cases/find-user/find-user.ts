import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { User } from 'src/shared/domain/entities/user';
import { UserRepositoryInterface } from '../../ports/user.repository.interface/user.repository.interface.interface';

@Injectable()
export class FindUserUseCase {
    constructor(
        @Inject('UserRepositoryInterface')
        private readonly userRepository: UserRepositoryInterface,
    ) { }

    async findByEmail(email: string): Promise<User> {
        const user = await this.userRepository.findByEmail(email);
        return user || null;
    }
}