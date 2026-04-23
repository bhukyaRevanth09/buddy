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

  // Load session on app startup
  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");
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

const login = async (userRole, resData) => {
  try {
    const token =
      resData.accessToken ||
      resData.token ||
      resData?.data?.accessToken;

    const profile =
      resData.buddy ||
      resData.user ||
      resData.data?.buddy ||
      resData.data?.user;

    // SAVE CORRECT KEYS
    await SecureStore.setItemAsync("accessToken", token);
    await SecureStore.setItemAsync("role", userRole);
    await SecureStore.setItemAsync("user", JSON.stringify(profile));

    console.log("TOKEN SAVED:", token);

    setAuthState({
      token,
      role: userRole,
      user: profile,
      isLoggedIn: true,
      loading: false,
    });

  } catch (e) {
    console.error("LOGIN ERROR:", e);
  }
};


const logout = async () => {
  const token = await SecureStore.getItemAsync("accessToken");
  console.log("LOGOUT TOKEN:", token);

  await SecureStore.deleteItemAsync("accessToken");
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