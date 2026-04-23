import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BuddyHome from "../screens/buddy/BuddyHomeScreen.js";
import ActiveJobScreen from "../screens/buddy/ActiveJobScreen.js";// Import your new screen

const Stack = createNativeStackNavigator();

export default function BuddyStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right' // Industry standard for flow-based navigation
      }}
    >
      {/* 1. Main Dashboard */}
      <Stack.Screen name="BuddyHome" component={BuddyHome} />

      {/* 2. Live Workflow Screen */}
      <Stack.Screen 
        name="ActiveJob" 
        component={ActiveJobScreen} 
        options={{
          headerShown: true,
          title: "Active Mission",
          gestureEnabled: false, // Prevents accidental exit from job
          headerBackVisible: false, // Force them to use 'Cancel' or 'Complete' buttons
        }}
      />
    </Stack.Navigator>
  );
}