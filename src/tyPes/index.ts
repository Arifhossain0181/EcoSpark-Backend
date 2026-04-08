import { Request } from 'express'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        role: 'MEMBER' | 'MANAGER' | 'ADMIN'
      }
    }
  }
}

export interface AuthRequest extends Request {
  user?: {
    id: string
    role: 'MEMBER' | 'MANAGER' | 'ADMIN'
  }
}

export interface IdeaQuery {
  search?: string
  category?: string
  isPaid?: string
  sort?: 'recent' | 'top' | 'commented'
  page?: string
  limit?: string
  includeTotal?: string
}