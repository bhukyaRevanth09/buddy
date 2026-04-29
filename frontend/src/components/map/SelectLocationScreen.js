import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";

import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps";
import * as Location from "expo-location";
import { LocationContext } from "../../context/LocationContext";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export default function SelectLocationScreen({ navigation }) {
  const { setSelectedLocation } = useContext(LocationContext);
  const mapRef = useRef(null);

  const [region, setRegion] = useState(null);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [userCurrentLocation, setUserCurrentLocation] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setRegion(coords);
      setUserCurrentLocation(coords);
    })();
  }, []);

  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;

    setSelectedCoords({
      latitude,
      longitude,
    });
  };

  const handleConfirm = () => {
    if (!selectedCoords) return;

    setSelectedLocation(selectedCoords);
    navigation.goBack();
  };

  const recenter = () => {
    if (!userCurrentLocation) return;
    mapRef.current?.animateToRegion(userCurrentLocation, 800);
  };

  if (!region) return null;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        onPress={handleMapPress}
        showsUserLocation
      >
        {selectedCoords && (
          <Marker coordinate={selectedCoords}>
            <Ionicons name="location-sharp" size={40} color="red" />
          </Marker>
        )}
      </MapView>

      <TouchableOpacity style={styles.recenterBtn} onPress={recenter}>
        <MaterialIcons name="my-location" size={26} color="#4CAF50" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
        <Text style={styles.confirmText}>Confirm Location</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  map: { flex: 1 },

  recenterBtn: {
    position: "absolute",
    bottom: 120,
    right: 20,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 40,
    elevation: 10,
  },

  confirmBtn: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "#000",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
  },

  confirmText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});