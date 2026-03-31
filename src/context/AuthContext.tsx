import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  type AuthTokens,
  type AuthUser,
  type LoginRole,
} from "@/lib/api";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tokens: AuthTokens | null;
  login: (
    email: string,
    password: string,
    loginAs: LoginRole,
  ) => Promise<{ success: boolean; message: string; role?: string }>;
  register: (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    role: LoginRole,
  ) => Promise<{ success: boolean; message: string; role?: string }>;
  logout: () => Promise<void>;
};

const TOKENS_STORAGE_KEY = "innotalk-auth-tokens";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const parseStoredValue = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? (JSON.parse(rawValue) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(() =>
    parseStoredValue<AuthTokens | null>(TOKENS_STORAGE_KEY, null),
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (tokens) {
      window.localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(tokens));
      return;
    }

    window.localStorage.removeItem(TOKENS_STORAGE_KEY);
  }, [tokens]);

  useEffect(() => {
    let ignore = false;

    const hydrateUser = async () => {
      if (!tokens?.accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await fetchCurrentUser(tokens.accessToken);
        if (!ignore) {
          setUser(currentUser);
        }
      } catch {
        if (!ignore) {
          setUser(null);
          setTokens(null);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    void hydrateUser();

    return () => {
      ignore = true;
    };
  }, [tokens]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      tokens,
      login: async (email, password, loginAs) => {
        try {
          const response = await loginUser({
            email: email.trim().toLowerCase(),
            password,
            loginAs,
          });

          setTokens(response.tokens);
          setUser(response.user);

          return {
            success: true,
            message: response.message,
            role: response.user.role,
          };
        } catch (error) {
          return {
            success: false,
            message: error instanceof Error ? error.message : "Unable to log in.",
          };
        }
      },
      register: async (firstName, lastName, email, password, role) => {
        try {
          const response = await registerUser({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim().toLowerCase(),
            password,
            role,
          });

          setTokens(response.tokens);
          setUser(response.user);

          return {
            success: true,
            message: response.message,
            role: response.user.role,
          };
        } catch (error) {
          return {
            success: false,
            message: error instanceof Error ? error.message : "Unable to register.",
          };
        }
      },
      logout: async () => {
        try {
          if (tokens?.accessToken) {
            await logoutUser(tokens.accessToken);
          }
        } catch {
          // Clear client auth state even if the backend logout request fails.
        } finally {
          setUser(null);
          setTokens(null);
        }
      },
    }),
    [isLoading, tokens, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
