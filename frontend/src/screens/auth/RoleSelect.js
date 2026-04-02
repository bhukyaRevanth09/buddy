import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function RoleSelect({ navigation }) {
  return (
    <View style={styles.container}>
      
      <Text style={styles.title}>Continue as</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("UserLogin", { role: "user" })}
      >
        <Text style={styles.Text}>User</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("BuddyLogin", { role: "buddy" })}
      >
        <Text style={styles.Text}>Buddy (Worker)</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  card: {
    padding: 20,
    backgroundColor: "#e1dede",
    borderRadius: 10,
    marginBottom: 15,
    alignItems: "center",
  },
  Text:{
    fontWeight:'400',
    fontSize:15
  }
});