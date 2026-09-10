import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AuthResponse, User, UserRole } from '../types';
import { authApi } from '../api/services';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('workdex_token'));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Qaysi token uchun /me so'rovi allaqachon yuborilganini eslab qolamiz —
  // login() dan keyin useEffect ayni shu tokenni qayta so'ramasligi uchun.
  const fetchedForToken = useRef<string | null>(null);

  // `authToken` argumenti login uchun kerak: setToken(...) dan keyin ham bu
  // funksiya closure dagi ESKI `token` ni ko'radi (birinchi loginda — null),
  // shuning uchun yangi token to'g'ridan-to'g'ri uzatiladi. Argument
  // berilmasa (refreshUser), state dagi token ishlatiladi.
  const fetchUser = async (authToken?: string | null) => {
    const activeToken = authToken === undefined ? token : authToken;
    try {
      if (activeToken) {
        fetchedForToken.current = activeToken;
        const u = await authApi.getMe();
        setUser(u);
      }
    } catch {
      fetchedForToken.current = null;
      localStorage.removeItem('workdex_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      fetchedForToken.current = null;
      setIsLoading(false);
      return;
    }

    // login() shu token uchun so'rovni allaqachon yubordi — takrorlamaymiz.
    if (fetchedForToken.current === token) return;

    fetchUser(token);
  }, [token]);

  const login = async (email: string, pass: string) => {
    const res: AuthResponse = await authApi.login(email, pass);
    localStorage.setItem('workdex_token', res.token);
    setToken(res.token);
    // Yangi tokenni bevosita uzatamiz — shu sabab bu `await` endi haqiqatan
    // ham foydalanuvchi ma'lumoti kelishini kutadi.
    await fetchUser(res.token);
  };

  const logout = () => {
    localStorage.removeItem('workdex_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user ? user.role : null,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
