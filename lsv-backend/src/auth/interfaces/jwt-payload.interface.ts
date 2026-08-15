export type JwtPurpose = 'access' | 'reset';

export interface JwtPayload {
  email: string;
  sub: string;
  role: string;
  tokenVersion?: number;
  purpose?: JwtPurpose;
  iat: number;
  exp: number;
}
