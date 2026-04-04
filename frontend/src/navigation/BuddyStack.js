import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BuddyHomeScreen from "../screens/buddy/BuddyHomeScreen";

const Stack = createNativeStackNavigator();

export default function BuddyStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BuddyHome" component={BuddyHomeScreen} />
    </Stack.Navigator>
  );
}