import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BottomTabs from "./BottomTabs";
import ForgotPasswordScreen from "../components/ForgotPassword.js";

import MatchingScreen from "../screens/user/MatchingScreen.js";
import TrackingScreen from "../screens/user/TrackingScreen.js"; // ✅ ADD

const Stack = createNativeStackNavigator();

export default function UserStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      {/* Main Tabs */}
      <Stack.Screen 
        name="MainTabs" 
        component={BottomTabs} 
      />

      {/* Matching Screen */}
      <Stack.Screen 
        name="Matching" 
        component={MatchingScreen} 
        options={{
          gestureEnabled: false,
          animation: 'fade_from_bottom'
        }}
      />

      {/* Tracking Screen */}
      <Stack.Screen 
        name="Tracking" 
        component={TrackingScreen} 
        options={{
          gestureEnabled: false,
          animation: 'slide_from_right'
        }}
      />

      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
      />

    </Stack.Navigator>
  );
}