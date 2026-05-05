import { createNativeStackNavigator } from "@react-navigation/native-stack";

import BottomTabs from "./BottomTabs";
import MatchingScreen from "../screens/user/MatchingScreen";
import TrackingScreen from "../screens/user/TrackingScreen";
import SelectLocationScreen from "../components/map/SelectLocationScreen";
import ForgotPasswordScreen from "../components/ForgotPassword";
import ArrivedScreen from "../screens/user/ArrivedScreen";
const Stack = createNativeStackNavigator();

export default function UserStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>

      {/* MAIN APP */}
      <Stack.Screen name="MainTabs" component={BottomTabs} />

      {/* BOOKING FLOW */}
      <Stack.Screen name="Matching" component={MatchingScreen} />
      <Stack.Screen name="Tracking" component={TrackingScreen} />

      {/* UTIL SCREENS */}
      <Stack.Screen
        name="SelectLocation"
        component={SelectLocationScreen}
      />

      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
      />


 <Stack.Screen
  name="Arrived"
   component={ArrivedScreen} 
   />
   
    </Stack.Navigator>
  );
}