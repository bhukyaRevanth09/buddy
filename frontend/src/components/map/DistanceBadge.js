import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function DistanceBadge({ distance, duration }) {

  if (!distance) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {distance} • {duration}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 80,
    alignSelf: "center",
    backgroundColor: "#000000cc",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20
  },
  text: {
    color: "#fff",
    fontWeight: "600"
  }
});