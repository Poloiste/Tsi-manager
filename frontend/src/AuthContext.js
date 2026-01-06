import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext();

// Token refresh retry configuration
const TOKEN_REFRESH_CONFIG = {
  maxRetries: 3,
  retryDelay: 2000, // 2 seconds
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    checkUser();
    
    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] State changed:', event);
      
      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
        setAuthError(null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setAuthError(null);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('[Auth] Token refreshed successfully');
        setUser(session?.user || null);
        setAuthError(null);
      } else if (event === 'USER_UPDATED') {
        setUser(session?.user || null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[Auth] Error checking session:', error);
        setAuthError(error.message);
        setUser(null);
      } else if (data.session) {
        setUser(data.session.user);
        setAuthError(null);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('[Auth] Unexpected error checking session:', error);
      setAuthError(error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async (retryCount = 0) => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }
      
      if (data.session) {
        setUser(data.session.user);
        setAuthError(null);
        console.log('[Auth] Session refreshed successfully');
        return data.session;
      }
      
      throw new Error('No session returned after refresh');
    } catch (error) {
      console.error(`[Auth] Token refresh attempt ${retryCount + 1} failed:`, error);
      
      // Retry on network errors
      if (retryCount < TOKEN_REFRESH_CONFIG.maxRetries) {
        const isNetworkError = 
          error.message?.includes('network') ||
          error.message?.includes('fetch') ||
          error.message?.includes('connection');
        
        if (isNetworkError) {
          console.warn(`[Auth] Retrying token refresh in ${TOKEN_REFRESH_CONFIG.retryDelay / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, TOKEN_REFRESH_CONFIG.retryDelay));
          return refreshSession(retryCount + 1);
        }
      }
      
      // If all retries failed or it's not a network error, handle the error
      setAuthError('Failed to refresh authentication. Please sign in again.');
      setUser(null);
      throw error;
    }
  };

  const signUp = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    
    if (error) throw error;
    
    if (data.user) {
      try {
        await supabase.from('users').insert([{
          id: data.user.id,
          email,
          name
        }]);
      } catch (dbError) {
        console.error('Error inserting user into database:', dbError);
        // User is still authenticated even if DB insert fails
        // This could be handled by a background sync or retry mechanism
      }
      
      setUser(data.user);
    }
    
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) throw error;
    
    if (data.user) {
      setUser(data.user);
    }
    
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, authError, signUp, signIn, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
