import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ArrivedScreen({ route, navigation }) {
  const { bookingId, buddy } = route.params || {};

  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Ionicons name="checkmark-circle" size={72} color="#34C759" />
      </View>

      <Text style={styles.title}>Buddy Arrived</Text>

      <Text style={styles.sub}>
        {buddy?.name || "Your buddy"} has reached your location.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Booking ID</Text>
        <Text style={styles.value}>{bookingId}</Text>

        <Text style={styles.info}>
          Please meet your buddy and allow them to start the work.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate("Booking")}
      >
        <Text style={styles.btnText}>View Booking</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        onPress={() => navigation.navigate("MainTabs")}
      >
        <Text style={styles.secondaryText}>Go Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FB",
    justifyContent: "center",
    padding: 22
  },

  iconBox: {
    alignSelf: "center",
    backgroundColor: "#EAF8EF",
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    color: "#111"
  },

  sub: {
    marginTop: 10,
    textAlign: "center",
    color: "#666",
    fontSize: 15,
    lineHeight: 22
  },

  card: {
    marginTop: 28,
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 20,
    elevation: 5
  },

  label: {
    color: "#777",
    fontSize: 12
  },

  value: {
    marginTop: 4,
    fontWeight: "800",
    color: "#111"
  },

  info: {
    marginTop: 16,
    color: "#555",
    lineHeight: 21
  },

  btn: {
    marginTop: 26,
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 16,
    alignItems: "center"
  },

  btnText: {
    color: "#fff",
    fontWeight: "900"
  },

  secondaryBtn: {
    marginTop: 12,
    padding: 14,
    alignItems: "center"
  },

  secondaryText: {
    color: "#007AFF",
    fontWeight: "800"
  }
});