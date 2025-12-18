import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getCoachByUserId } from '../services/supabaseService';
import type { Coach } from '../types';

interface AuthContextType {
  user: User | null;
  coach: Coach | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshCoach: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Global flag to prevent profile fetch during session setting (prevents deadlock)
let isSessionBeingSet = false;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch coach profile by user ID with timeout
  const fetchCoachProfile = useCallback(async (userId: string) => {
    try {
      console.log('[AuthContext] Fetching coach profile for user:', userId);

      // Add timeout to prevent hanging on RLS policy checks
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timed out')), 5000)
      );

      const coachData = await Promise.race([
        getCoachByUserId(userId),
        timeoutPromise
      ]);

      if (!coachData) {
        console.log('[AuthContext] No coach data returned for user:', userId);
        console.log('[AuthContext] This might be a new user - profile may not exist yet');
        setCoach(null);
        return;
      }

      console.log('[AuthContext] Coach profile fetched successfully');
      console.log('[AuthContext] Coach name:', coachData.name);
      console.log('[AuthContext] Coach email:', coachData.email);
      console.log('[AuthContext] Subscription status:', coachData.subscriptionStatus);

      setCoach(coachData);
    } catch (error: any) {
      console.log('[AuthContext] Could not fetch profile (likely new user):', error.message);
      setCoach(null);
    }
  }, []); // Empty dependency array - function doesn't depend on any props or state

  // Initialize auth state and set up listener
  useEffect(() => {
    // Check current session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          await fetchCoachProfile(session.user.id);
        }
      } catch (error) {
        console.error('[AuthContext] Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth state changed:', event);

      // Set flag when session is being established/refreshed
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        isSessionBeingSet = true;
        console.log('[AuthContext] Session being set, delaying profile fetch...');
      }

      if (session?.user) {
        setUser(session.user);

        // CRITICAL GUARD: Only fetch profile if session is not actively changing
        if (!isSessionBeingSet) {
          console.log('[AuthContext] Fetching profile (session stable)');
          // Fetch profile in background - don't await to avoid blocking
          fetchCoachProfile(session.user.id).catch(err => {
            console.error('[AuthContext] Background profile fetch failed:', err);
          });
        } else {
          console.log('[AuthContext] Skipping profile fetch (session being set)');
        }
      } else {
        setUser(null);
        setCoach(null);
      }

      setLoading(false);

      // Reset flag after a delay to allow AuthContext logic to fully process
      setTimeout(() => {
        isSessionBeingSet = false;
        console.log('[AuthContext] Session stabilized, profile fetch re-enabled');
      }, 100);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        await fetchCoachProfile(data.user.id);
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred' };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setCoach(null);
    } catch (error) {
      console.error('[AuthContext] Error logging out:', error);
    }
  };

  // Refresh coach profile (useful after updates)
  const refreshCoach = useCallback(async () => {
    if (user) {
      await fetchCoachProfile(user.id);
    }
  }, [user, fetchCoachProfile]);

  const value: AuthContextType = {
    user,
    coach,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshCoach,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
