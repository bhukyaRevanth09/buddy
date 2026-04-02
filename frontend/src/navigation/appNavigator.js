import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LandingScreen from "../screens/Landing/LandingScreen.js";
import RoleSelect from "../screens/auth/RoleSelect.js";
import HomeScreen from "../screens/user/HomeScreen.js";
import OTPScreen from "../screens/auth/OTPScreen.js";
import UserLoginScreen from "../screens/auth/UserLoginScreen.js";
import UserRegisterScreen from "../screens/auth/UserRegisterScreen.js";
import BuddyLoginScreen from "../screens/auth/BuddyLoginScreen.js";
import BuddyRegisterScreen from "../screens/auth/BuddyRegisterScreen.js";
import BuddyHomeScreen from "../screens/buddy/BuddyHomeScreen.js";
const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="RoleBase" component={RoleSelect}/>
        <Stack.Screen name="UserLogin" component={UserLoginScreen} />
        <Stack.Screen name="UserRegister" component={UserRegisterScreen} />
        <Stack.Screen name="BuddyLogin" component={BuddyLoginScreen}/>
        <Stack.Screen name="BuddyRegister" component={BuddyRegisterScreen}/>
        <Stack.Screen name="OTP" component={OTPScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="BuddyHome" component={BuddyHomeScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}