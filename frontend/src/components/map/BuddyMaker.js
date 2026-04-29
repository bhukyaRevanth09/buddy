import React from "react";
import { Marker } from "react-native-maps";
import { View, Text, StyleSheet } from "react-native";

export default function BuddyMarker({ buddy, onPress }) {

  if (!buddy?.location?.coordinates) return null;

  const [lng, lat] = buddy.location.coordinates;

  const isOnline = buddy?.isOnline;

  return (
    <Marker
      coordinate={{
        latitude: lat,
        longitude: lng,
      }}
      title={buddy.name}
      onPress={() => onPress?.(buddy)}
    >

      {/* MARKER UI */}
      <View style={[
        styles.marker,
        isOnline ? styles.online : styles.offline
      ]}>

        <Text style={styles.icon}>🧑</Text>

        {/* ONLINE DOT */}
        <View style={[
          styles.dot,
          { backgroundColor: isOnline ? "#00C853" : "#FF3B30" }
        ]} />

      </View>

    </Marker>
  );
}

const styles = StyleSheet.create({

  marker: {
    padding: 8,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5
  },

  online: {
    backgroundColor: "#E8F5E9"
  },

  offline: {
    backgroundColor: "#FFEBEE"
  },

  icon: {
    fontSize: 18
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: "absolute",
    bottom: 2,
    right: 2
  }

});