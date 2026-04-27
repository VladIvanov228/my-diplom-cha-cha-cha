export interface User {
  id: number
  username: string
  email: string
  role: 'dm' | 'player' | 'admin'
  avatar_url?: string
  created_at?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}