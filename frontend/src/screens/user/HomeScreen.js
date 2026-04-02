import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      
      <Text style={styles.title}>Select Service</Text>

      <TouchableOpacity style={styles.card}>
        <Text>Cleaning</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card}>
        <Text>Electrician</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card}>
        <Text>Plumbing</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  card: {
    padding: 20,
    backgroundColor: "#eee",
    borderRadius: 10,
    marginBottom: 10,
  },
});