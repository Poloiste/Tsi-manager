import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setUser(data.session.user);
      }
    } catch (error) {
      console.error('Erreur vérification session:', error);
    }
    setLoading(false);
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
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
