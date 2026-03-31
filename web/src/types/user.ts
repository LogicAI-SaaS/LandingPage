export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  plan: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}
