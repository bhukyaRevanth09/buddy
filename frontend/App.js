import React from "react";
import { NavigationContainer } from "@react-navigation/native";

import RootNavigation from "./src/navigation/RootNavigation.js";

import { AuthProvider } from "./src/context/AuthContext.js";
import { SocketProvider } from "./src/context/socketContext.js";
import { LocationProvider } from "./src/context/LocationContext.js";
import { BookingProvider } from "./src/context/BookkingContext.js";
import ErrorBoundary from "./src/components/ErrorBoundary.js";

const App = () => {
  return (
    <ErrorBoundary> 
    <LocationProvider>
      <AuthProvider>
        <SocketProvider>
          <BookingProvider>
            <NavigationContainer>
              <RootNavigation />
            </NavigationContainer>
          </BookingProvider>
        </SocketProvider>
      </AuthProvider>
    </LocationProvider>
    </ErrorBoundary>
  );
};

export default App;