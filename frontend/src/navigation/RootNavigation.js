import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import AuthStack from "./AuthStack";
import UserStack from "./UserStack";
import BuddyStack from "./BuddyStack";


export default function RootNavigation() {
  const { isLoggedIn, role } = useAuth();

  return (
    <NavigationContainer>
      {!isLoggedIn ? (
        <AuthStack />
      ) : role === "buddy" ? (
        <BuddyStack />
      ) : (
        <UserStack />
      )}
    </NavigationContainer>
  );
}