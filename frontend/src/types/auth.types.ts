export type Role = 'ADMIN' | 'USER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface DecodedToken {
  sub: string;
  email: string;
  role: Role;
  exp: number;
  iat: number;
}

