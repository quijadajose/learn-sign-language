// export class UserRepository {}

import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/shared/domain/entities/user';
import { UserRepositoryInterface } from 'src/auth/domain/ports/user.repository.interface/user.repository.interface.interface';

@Injectable()
export class UserRepository implements UserRepositoryInterface {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async findById(id: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { id } });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    async save(user: User): Promise<User> {
        return this.userRepository.save(user);
    }
}
