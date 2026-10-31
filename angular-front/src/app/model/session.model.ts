export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Session {
  token: string;
  expiresAt: string;
  user: User;
}
