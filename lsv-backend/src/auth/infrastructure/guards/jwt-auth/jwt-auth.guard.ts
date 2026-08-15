import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokenService } from 'src/auth/domain/ports/token.service/token.service.interface';
import { UserRepositoryInterface } from 'src/auth/domain/ports/user.repository.interface/user.repository.interface';
import { extractAccessToken } from 'src/shared/infrastructure/extract-access-token';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject('TokenService')
    private readonly tokenService: TokenService,
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = extractAccessToken(request);

    if (!token) {
      throw new UnauthorizedException('errors.auth.noToken');
    }

    try {
      const payload = this.tokenService.verifyToken(token);
      const authState = await this.userRepository.findAuthStateById(
        payload.sub,
      );
      if (
        !authState ||
        authState.tokenVersion !== (payload.tokenVersion ?? 0)
      ) {
        throw new UnauthorizedException('errors.auth.invalidToken');
      }
      request.user = {
        sub: payload.sub,
        email: payload.email,
        role: authState.role,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('errors.auth.invalidToken');
    }
  }
}
