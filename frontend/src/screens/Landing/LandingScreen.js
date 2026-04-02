import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function LandingScreen({ navigation }) {
  return (
    <View style={styles.container}>
      
      <Text style={styles.title}>Buddy</Text>
      <Text style={styles.subtitle}>
        Find trusted help instantly
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("RoleBase")}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  subtitle: {
    marginVertical: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: "black",
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: "white",
  },
});