/**
 * Tests for AuthContext
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { supabase } from './supabaseClient';

// Mock supabase
jest.mock('./supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      refreshSession: jest.fn()
    },
    from: jest.fn()
  }
}));

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Default mock for onAuthStateChange
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: jest.fn()
        }
      }
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  describe('initialization', () => {
    it('should initialize with loading state', () => {
      supabase.auth.getSession.mockResolvedValue({ data: {}, error: null });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBe(null);
    });

    it('should set user when session exists', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.authError).toBe(null);
    });

    it('should handle session check error', async () => {
      const mockError = { message: 'Session check failed' };
      supabase.auth.getSession.mockResolvedValue({
        data: {},
        error: mockError
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBe(null);
      expect(result.current.authError).toBe('Session check failed');
    });
  });

  describe('signUp', () => {
    it('should sign up user successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      supabase.auth.getSession.mockResolvedValue({ data: {}, error: null });
      supabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ data: null, error: null })
        })
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signUp('test@example.com', 'password', 'Test User');
      });

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
        options: { data: { name: 'Test User' } }
      });
      expect(result.current.user).toEqual(mockUser);
    });

    it('should handle sign up error', async () => {
      supabase.auth.getSession.mockResolvedValue({ data: {}, error: null });
      supabase.auth.signUp.mockResolvedValue({
        data: {},
        error: new Error('Sign up failed')
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.signUp('test@example.com', 'password', 'Test User')
      ).rejects.toThrow('Sign up failed');
    });
  });

  describe('signIn', () => {
    it('should sign in user successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      supabase.auth.getSession.mockResolvedValue({ data: {}, error: null });
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.signIn('test@example.com', 'password');
      });

      expect(result.current.user).toEqual(mockUser);
    });
  });

  describe('refreshSession', () => {
    it('should refresh session successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      supabase.auth.getSession.mockResolvedValue({ data: {}, error: null });
      supabase.auth.refreshSession.mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let session;
      await act(async () => {
        session = await result.current.refreshSession();
      });

      expect(session.user).toEqual(mockUser);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.authError).toBe(null);
    });

    it('should retry on network error', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      supabase.auth.getSession.mockResolvedValue({ data: {}, error: null });
      
      // First call fails with network error, second succeeds
      supabase.auth.refreshSession
        .mockResolvedValueOnce({
          data: {},
          error: new Error('network timeout')
        })
        .mockResolvedValueOnce({
          data: { session: { user: mockUser } },
          error: null
        });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let session;
      await act(async () => {
        const promise = result.current.refreshSession();
        // Fast-forward the retry delay
        jest.advanceTimersByTime(2000);
        session = await promise;
      });

      expect(supabase.auth.refreshSession).toHaveBeenCalledTimes(2);
      expect(session.user).toEqual(mockUser);
    });

    it('should fail after max retries', async () => {
      supabase.auth.getSession.mockResolvedValue({ data: {}, error: null });
      supabase.auth.refreshSession.mockResolvedValue({
        data: {},
        error: new Error('network timeout')
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        const promise = result.current.refreshSession();
        // Fast-forward through all retries
        for (let i = 0; i < 4; i++) {
          jest.advanceTimersByTime(2000);
        }
        await expect(promise).rejects.toThrow();
      });

      expect(result.current.authError).toBe('Failed to refresh authentication. Please sign in again.');
      expect(result.current.user).toBe(null);
    });

    it('should not retry on non-network errors', async () => {
      supabase.auth.getSession.mockResolvedValue({ data: {}, error: null });
      supabase.auth.refreshSession.mockResolvedValue({
        data: {},
        error: new Error('Invalid token')
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await expect(result.current.refreshSession()).rejects.toThrow('Invalid token');
      });

      expect(supabase.auth.refreshSession).toHaveBeenCalledTimes(1);
    });
  });

  describe('auth state changes', () => {
    it('should update user on SIGNED_IN event', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      let authCallback;
      
      supabase.auth.getSession.mockResolvedValue({ data: {}, error: null });
      supabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return {
          data: {
            subscription: { unsubscribe: jest.fn() }
          }
        };
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        authCallback('SIGNED_IN', { user: mockUser });
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.authError).toBe(null);
    });

    it('should clear user on SIGNED_OUT event', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      let authCallback;
      
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } },
        error: null
      });
      supabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return {
          data: {
            subscription: { unsubscribe: jest.fn() }
          }
        };
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);

      act(() => {
        authCallback('SIGNED_OUT', null);
      });

      expect(result.current.user).toBe(null);
      expect(result.current.authError).toBe(null);
    });

    it('should handle TOKEN_REFRESHED event', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      let authCallback;
      
      supabase.auth.getSession.mockResolvedValue({ data: {}, error: null });
      supabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return {
          data: {
            subscription: { unsubscribe: jest.fn() }
          }
        };
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        authCallback('TOKEN_REFRESHED', { user: mockUser });
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.authError).toBe(null);
    });
  });
});
