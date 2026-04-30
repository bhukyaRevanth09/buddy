import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  TextInput,
  Alert
} from "react-native";

import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps";
import * as Location from "expo-location";
import { LocationContext } from "../../context/LocationContext";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";

const { height } = Dimensions.get("window");

export default function SelectLocationScreen({ navigation }) {

  const { setSelectedLocation } = useContext(LocationContext);
  const mapRef = useRef(null);

  const [region, setRegion] = useState(null);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [userCurrentLocation, setUserCurrentLocation] = useState(null);

  const [houseNo, setHouseNo] = useState("");
  const [road, setRoad] = useState("");
  const [landmark, setLandmark] = useState(""); // ✅ USER ONLY
  const [type, setType] = useState("home");

  const [modalVisible, setModalVisible] = useState(false);

  /*
  ===============================
  GET CURRENT LOCATION
  ===============================
  */
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission denied");
        return;
      }

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

  /*
  ===============================
  MAP CLICK
  ===============================
  */
  const handleMapPress = async (e) => {

    const { latitude, longitude } = e.nativeEvent.coordinate;

    setSelectedCoords({ latitude, longitude });

    // ✅ HARD RESET (IMPORTANT)
    setHouseNo("");
    setRoad("");
    setLandmark(""); // 🔥 ALWAYS EMPTY

    try {
      const res = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (res.length > 0) {

        const addr = res[0];

        /*
        ===============================
        ROAD (ONLY STREET + AREA)
        ===============================
        */
        const cleanRoad = [
          addr.street,
          addr.district
        ]
          .filter(Boolean)
          .filter((v, i, arr) => arr.indexOf(v) === i)
          .join(", ");

        setRoad(cleanRoad);

        /*
        ===============================
        HOUSE NUMBER
        ===============================
        */
        setHouseNo(addr.streetNumber || "");

        /*
        ❌ DO NOT TOUCH LANDMARK
        */
        setLandmark(""); // 🔥 force empty again
      }

    } catch (err) {
      console.log("Geocode error", err);
    }
  };

  /*
  ===============================
  CONFIRM CLICK
  ===============================
  */
  const handleConfirm = () => {
    if (!selectedCoords) {
      Alert.alert("Select a location first");
      return;
    }
    setModalVisible(true);
  };

  /*
  ===============================
  SAVE ADDRESS
  ===============================
  */
  const saveAddress = () => {

    const fullAddress = [
      houseNo?.trim(),
      road?.trim(),
      landmark?.trim()
    ]
      .filter(Boolean)
      .join(", ");

    const fullLocation = {
      latitude: selectedCoords.latitude,
      longitude: selectedCoords.longitude,

      houseNo: houseNo?.trim(),
      road: road?.trim(),

      // ✅ ONLY USER INPUT (no auto values ever)
      landmark: landmark?.trim(),

      type,
      fullAddress
    };

    setSelectedLocation(fullLocation);

    setModalVisible(false);
    navigation.goBack();
  };

  /*
  ===============================
  RECENTER
  ===============================
  */
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

      {/* RECENTER */}
      <TouchableOpacity style={styles.recenterBtn} onPress={recenter}>
        <MaterialIcons name="my-location" size={26} color="#4CAF50" />
      </TouchableOpacity>

      {/* CONFIRM */}
      <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
        <Text style={styles.confirmText}>Confirm Location</Text>
      </TouchableOpacity>

      {/* MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>

            <Text style={styles.modalTitle}>Complete Address</Text>

            <TextInput
              placeholder="House / Flat No"
              value={houseNo}
              onChangeText={setHouseNo}
              style={styles.input}
            />

            <TextInput
              placeholder="Road / Area"
              value={road}
              onChangeText={setRoad}
              style={styles.input}
            />

            <TextInput
              placeholder="Landmark (Enter manually)"
              value={landmark}
              onChangeText={setLandmark}
              style={styles.input}
            />

            <View style={styles.typeContainer}>
              {["home", "work", "other"].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.typeBtn,
                    type === item && styles.activeType,
                  ]}
                  onPress={() => setType(item)}
                >
                  <Text style={{
                    color: type === item ? "#fff" : "#000",
                    fontWeight: "bold",
                  }}>
                    {item.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveAddress}>
              <Text style={styles.saveText}>Save Address</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

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

modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.5)",
  justifyContent: "center",
  alignItems: "center",
},

modalBox: {
  width: "85%",
  backgroundColor: "#fff",
  borderRadius: 15,
  padding: 20,
},

modalTitle: {
  fontSize: 18,
  fontWeight: "bold",
  marginBottom: 15,
},

input: {
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 10,
  padding: 12,
  marginBottom: 10,
},

typeContainer: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginVertical: 10,
},

typeBtn: {
  flex: 1,
  padding: 10,
  marginHorizontal: 5,
  borderRadius: 10,
  borderWidth: 1,
  alignItems: "center",
},

activeType: {
  backgroundColor: "#000",
},

saveBtn: {
  backgroundColor: "#000",
  padding: 15,
  borderRadius: 10,
  alignItems: "center",
  marginTop: 10,
},

saveText: {
  color: "#fff",
  fontWeight: "bold",
},

cancelBtn: {
  marginTop: 10,
  alignItems: "center",
},

cancelText: {
  color: "red",
  fontWeight: "bold",
}
});