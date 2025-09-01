import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSessionCookie, setSessionCookie, clearSessionCookie } from '@/lib/auth'
import { cookies } from 'next/headers'

// Mock za next/headers cookies
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn()
  })
}))

describe('Auth utility functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  describe('getSessionCookie', () => {
    it('should return null when session cookie does not exist', () => {
      // Mock vraća undefined za nepostojeći cookie
      vi.mocked(cookies().get).mockReturnValueOnce(undefined)
      
      expect(getSessionCookie()).toBeNull()
    })
    
    it('should return session data when cookie exists', () => {
      // Test podaci
      const testSession = { userId: 1, name: 'Test User', role: 'ADMIN' }
      
      // Mock vraća cookie sa session podacima
      vi.mocked(cookies().get).mockReturnValueOnce({
        name: 'session',
        value: JSON.stringify(testSession)
      })
      
      const result = getSessionCookie()
      expect(result).toEqual(testSession)
    })
    
    it('should return null when cookie value cannot be parsed', () => {
      // Mock vraća cookie sa nevažećim JSON
      vi.mocked(cookies().get).mockReturnValueOnce({
        name: 'session',
        value: 'invalid-json'
      })
      
      const result = getSessionCookie()
      expect(result).toBeNull()
    })
  })
  
  describe('setSessionCookie', () => {
    it('should set session cookie with provided data', () => {
      const sessionData = { userId: 1, name: 'Test User', role: 'ADMIN' }
      
      setSessionCookie(sessionData)
      
      expect(cookies().set).toHaveBeenCalledWith({
        name: 'session',
        value: JSON.stringify(sessionData),
        httpOnly: true,
        path: '/',
        maxAge: expect.any(Number),
        secure: expect.any(Boolean)
      })
    })
  })
  
  describe('clearSessionCookie', () => {
    it('should delete session cookie', () => {
      clearSessionCookie()
      
      expect(cookies().delete).toHaveBeenCalledWith('session')
    })
  })
})
