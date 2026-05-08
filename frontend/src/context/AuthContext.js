import React, { createContext, useState, useContext, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    token: null,
    refreshToken: null,
    isLoggedIn: false,
    role: null,
    user: null,
    loading: true
  });

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const token = await SecureStore.getItemAsync("accessToken");
        const refreshToken = await SecureStore.getItemAsync("refreshToken");
        const role = await SecureStore.getItemAsync("role");
        const userString = await SecureStore.getItemAsync("user");

        if (token && role && userString) {
          setAuthState({
            token,
            refreshToken,
            role,
            user: JSON.parse(userString),
            isLoggedIn: true,
            loading: false
          });
        } else {
          setAuthState({
            token: null,
            refreshToken: null,
            role: null,
            user: null,
            isLoggedIn: false,
            loading: false
          });
        }
      } catch (e) {
        console.log("LOAD AUTH ERROR:", e);

        setAuthState({
          token: null,
          refreshToken: null,
          role: null,
          user: null,
          isLoggedIn: false,
          loading: false
        });
      }
    };

    loadStorageData();
  }, []);

  const login = async (userRole, resData) => {
    try {
      const accessToken = resData?.accessToken;
      const refreshToken = resData?.refreshToken;

      const profile =
        resData?.user ||
        resData?.buddy ||
        resData?.data?.user ||
        resData?.data?.buddy ||
        null;

      if (!accessToken || !userRole) {
        console.log("LOGIN DATA MISSING:", resData);
        return;
      }

      await SecureStore.setItemAsync("accessToken", accessToken);
      await SecureStore.setItemAsync("refreshToken", refreshToken || "");
      await SecureStore.setItemAsync("role", userRole);
      await SecureStore.setItemAsync("user", JSON.stringify(profile || {}));

      setAuthState({
        token: accessToken,
        refreshToken,
        role: userRole,
        user: profile,
        isLoggedIn: true,
        loading: false
      });
    } catch (e) {
      console.log("LOGIN ERROR:", e);
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    await SecureStore.deleteItemAsync("role");
    await SecureStore.deleteItemAsync("user");

    setAuthState({
      token: null,
      refreshToken: null,
      isLoggedIn: false,
      role: null,
      user: null,
      loading: false
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);