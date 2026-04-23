import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigation from './src/navigation/RootNavigation.js';
import { AuthProvider } from './src/context/AuthContext.js';
import { SocketProvider } from './src/context/socketContext.js';

const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <NavigationContainer>
          <RootNavigation />
        </NavigationContainer>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;