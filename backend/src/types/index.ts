export interface UserPayload {
  id: string;
  email: string;
  role: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}