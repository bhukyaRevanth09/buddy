import React from "react";
import { Marker } from "react-native-maps";
import { View, Text, StyleSheet } from "react-native";

export default function UserMarker({ location }) {

  if (!location?.latitude || !location?.longitude) return null;

  return (
    <Marker
      coordinate={{
        latitude: location.latitude,
        longitude: location.longitude
      }}
      title="You"
    >

      {/* MAIN PIN */}
      <View style={styles.container}>

        {/* OUTER RING */}
        <View style={styles.ring} />

        {/* CENTER DOT */}
        <View style={styles.marker}>
          <Text style={styles.icon}>📍</Text>
        </View>

      </View>

    </Marker>
  );
}

const styles = StyleSheet.create({

  container: {
    alignItems: "center",
    justifyContent: "center"
  },

  ring: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(52,199,89,0.2)"
  },

  marker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#34C759",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    elevation: 5
  },

  icon: {
    fontSize: 14
  }

});