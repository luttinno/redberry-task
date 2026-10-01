export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  fullName: string | null;
  mobileNumber: string | null;
  dateOfBirth: string | null;
  age: number | null;
  preferredVenue: {
    id: number;
    slug: string;
    name: string;
    city: string;
    formats: {
      id: number;
      slug: string;
      name: string;
      priceUplift: number;
    }[];
  } | null;
  profileComplete: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  username: string;
  passwordConfirmation: string;
  avatar?: File;
}
