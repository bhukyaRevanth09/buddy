import { View, Text } from 'react-native'
import RootNavigation from './src/navigation/RootNavigation.js';
import { AuthProvider } from './src/context/AuthContext.js';
const App = () => {
  return(
    <AuthProvider>
      <RootNavigation/>
    </AuthProvider>
  ) ;
}

export default App
