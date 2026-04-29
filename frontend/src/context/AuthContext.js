import React, { createContext, useState, useContext, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    token: null,
    isLoggedIn: false,
    role: null,
    user: null,
    loading: true,
  });

  // LOAD SESSION
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const token = await SecureStore.getItemAsync("accessToken");
        const role = await SecureStore.getItemAsync("role");
        const user = await SecureStore.getItemAsync("user");

        if (token && role) {
          setAuthState({
            token,
            role,
            user: JSON.parse(user),
            isLoggedIn: true,
            loading: false,
          });
        } else {
          setAuthState((prev) => ({ ...prev, loading: false }));
        }
      } catch (e) {
        setAuthState((prev) => ({ ...prev, loading: false }));
      }
    };

    loadStorageData();
  }, []);

  // LOGIN
  const login = async (userRole, resData) => {
    try {
      const accessToken = resData.accessToken;
      const refreshToken = resData.refreshToken;

      const profile =
        resData.user ||
        resData.buddy ||
        resData.data?.user ||
        resData.data?.buddy;

      // SAVE
      await SecureStore.setItemAsync("accessToken", accessToken);
      await SecureStore.setItemAsync("refreshToken", refreshToken);
      await SecureStore.setItemAsync("role", userRole);
      await SecureStore.setItemAsync("user", JSON.stringify(profile));

      setAuthState({
        token: accessToken,
        role: userRole,
        user: profile,
        isLoggedIn: true,
        loading: false,
      });

    } catch (e) {
      console.error("LOGIN ERROR:", e);
    }
  };

  // LOGOUT
  const logout = async () => {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    await SecureStore.deleteItemAsync("role");
    await SecureStore.deleteItemAsync("user");

    setAuthState({
      token: null,
      isLoggedIn: false,
      role: null,
      user: null,
      loading: false,
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);