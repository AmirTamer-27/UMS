import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { authService } from "../services/supabase/auth";
import { supabase } from "../services/supabase/client";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const withTimeout = useCallback(async (promise, label) => {
    let timeoutId;

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error(`${label} is taking too long.`));
      }, 10000);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      window.clearTimeout(timeoutId);
    }
  }, []);

  const loadProfile = useCallback(async (authUser) => {
    if (!authUser?.id) {
      setProfile(null);
      setRole(null);
      return null;
    }

    const nextProfile = await withTimeout(
      authService.getProfile(authUser.id),
      "Loading your application profile",
    );
    setProfile(nextProfile);
    setRole(nextProfile?.role ?? null);
    return nextProfile;
  }, [withTimeout]);

  const applySession = useCallback(
    async (nextSession) => {
      const nextUser = nextSession?.user ?? null;
      setSession(nextSession ?? null);
      setUser(nextUser);

      if (nextUser) {
        await loadProfile(nextUser);
      } else {
        setProfile(null);
        setRole(null);
      }
    },
    [loadProfile],
  );

  useEffect(() => {
    let isActive = true;

    const initializeAuth = async () => {
      setLoading(true);
      setError(null);

      try {
        const currentSession = await authService.getSession();

        if (isActive) {
          await applySession(currentSession);
        }
      } catch (authError) {
        if (isActive) {
          setError(authError.message);
          await applySession(null);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    if (!supabase) {
      return () => {
        isActive = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!isActive) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        await applySession(nextSession);
      } catch (authError) {
        setError(authError.message);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const login = useCallback(
    async ({ email, password }) => {
      setLoading(true);
      setError(null);

      try {
        const data = await authService.signIn({ email, password });
        await applySession(data.session);
        return data;
      } catch (authError) {
        setError(authError.message);
        throw authError;
      } finally {
        setLoading(false);
      }
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await authService.signOut();
      await applySession(null);
    } catch (authError) {
      setError(authError.message);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, [applySession]);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      role,
      loading,
      error,
      isAuthenticated: Boolean(session?.user),
      login,
      logout,
      refreshProfile: () => loadProfile(user),
    }),
    [error, loadProfile, loading, login, logout, profile, role, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
};
