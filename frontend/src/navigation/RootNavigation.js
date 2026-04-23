import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext.js";
import BuddyStack from "./BuddyStack.js";
import UserStack from "./UserStack.js";
import AuthStack from "./AuthStack.js";

export default function RootNavigator() {
  const { isLoggedIn, role, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isLoggedIn) return <AuthStack />;
  if (role === "buddy") return <BuddyStack />;
  return <UserStack />;
}