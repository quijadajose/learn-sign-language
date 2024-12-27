import { Injectable } from "@nestjs/common";
import { HashService } from "src/auth/domain/ports/hash.service.interface/hash.service.interface";
import * as bcrypt from 'bcrypt';

@Injectable()
export class BcryptService implements HashService {
    async hash(data: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(data, salt);
    }

    async compare(data: string, encrypted: string): Promise<boolean> {
        return bcrypt.compare(data, encrypted);
    }
}