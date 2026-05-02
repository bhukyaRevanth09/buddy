import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert
} from "react-native";

import api from "../../api/Apiclient";
import { SocketContext } from "../../context/socketContext.js";
import { LocationContext } from "../../context/LocationContext";
import * as Location from "expo-location";

export default function HomeScreen({ navigation }) {

  const { socket } = useContext(SocketContext);
  const { currentLocation, selectedLocation } = useContext(LocationContext);

  const userLocation = selectedLocation ?? currentLocation ?? null;

  const [address, setAddress] = useState("");

  const [categories, setCategories] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [availableInterests, setAvailableInterests] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  /*
  =========================
  SOCKET LISTENERS
  =========================
  */
  useEffect(() => {
    if (!socket) return;

    const onAccepted = (data) => {
      console.log("✅ Booking accepted:", data);

      navigation.navigate("Tracking", {
        bookingId: data.bookingId,
        buddy: data.buddy,
        userLocation // ✅ FIXED
      });
    };

    const onTrackingStart = (data) => {
      console.log("🚀 Tracking started:", data);

      navigation.navigate("Tracking", {
        bookingId: data.bookingId,
        buddy: data.buddy || { _id: data.buddyId },
        userLocation // ✅ FIXED
      });
    };

    socket.on("booking-accepted", onAccepted);
    socket.on("tracking_started", onTrackingStart);

    return () => {
      socket.off("booking-accepted", onAccepted);
      socket.off("tracking_started", onTrackingStart);
    };

  }, [socket, userLocation]);

  /*
  =========================
  REVERSE GEOCODING
  =========================
  */
  useEffect(() => {
    const fetchAddress = async () => {
      if (!userLocation) return;

      try {
        const result = await Location.reverseGeocodeAsync({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        });

        if (result.length > 0) {
          const place = result[0];

          const formatted = [
            place.name,
            place.street,
            place.city || place.district,
            place.region,
            place.country
          ]
            .filter(Boolean)
            .join(", ");

          setAddress(formatted);
        }
      } catch (err) {
        console.log("Reverse geocode error:", err);
      }
    };

    fetchAddress();
  }, [userLocation]);

  /*
  =========================
  LOAD DATA
  =========================
  */
  useEffect(() => {
    (async () => {
      try {
        const [catRes, intRes] = await Promise.all([
          api.get("/user/categories"),
          api.get("/user/interests")
        ]);

        setCategories(catRes.data.data || []);
        setAvailableInterests(intRes.data.data || []);

      } catch (err) {
        console.log("Load error:", err);
      } finally {
        setLoading(false); // ✅ always stop loader
      }
    })();
  }, []);

  /*
  =========================
  LOAD SKILLS
  =========================
  */
  useEffect(() => {
    if (!selectedCategory?._id) {
      setAvailableSkills([]);
      setSelectedSkills([]);
      return;
    }

    api.get(`/user/skills/${selectedCategory._id}`)
      .then(res => setAvailableSkills(res.data.data || []))
      .catch(() => setAvailableSkills([]));

  }, [selectedCategory]);

  const toggleSelection = (id, list, setList) => {
    setList(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const isDisabled =
    !selectedCategory || selectedSkills.length === 0 || !userLocation;

  /*
  =========================
  BOOKING REQUEST
  =========================
  */
  const handleFindBuddy = async () => {
    if (isDisabled || bookingLoading) return;

    try {
      setBookingLoading(true);

      const payload = {
        category: selectedCategory._id,
        skills: selectedSkills,
        interests: selectedInterests,
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        fullAddress: address || "Unknown location",
        price: 0
      };

      const res = await api.post("/booking/request", payload);

      if (!res.data.success) {
        Alert.alert("Error", res.data.message);
        return;
      }

      navigation.navigate("Matching", {
        bookingId: res.data.bookingId,
        location: userLocation
      });

    } catch (err) {
      Alert.alert(
        "Booking Failed",
        err?.response?.data?.message || "Server error"
      );
    } finally {
      setBookingLoading(false); // ✅ FIXED
    }
  };

  /*
  =========================
  LOADING
  =========================
  */
  if (loading || !userLocation) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Find a Buddy</Text>
        <Text style={styles.sub}>Select category, skills & interests</Text>
      </View>

      {/* LOCATION */}
      <TouchableOpacity
        style={styles.locationBox}
        onPress={() => navigation.navigate("SelectLocation")}
      >
        <Text style={styles.locationTitle}>
          📍 {selectedLocation ? "Selected Location" : "Current Location"}
        </Text>

        <Text style={styles.locationSub}>
          {address || "Fetching address..."}
        </Text>
      </TouchableOpacity>

      {/* PANEL */}
      <View style={styles.panel}>
        <ScrollView>

          {/* CATEGORY */}
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map(c => (
              <TouchableOpacity
                key={c._id}
                onPress={() => setSelectedCategory(c)}
                style={[
                  styles.chip,
                  selectedCategory?._id === c._id && styles.activeChip
                ]}
              >
                <Text style={{
                  color: selectedCategory?._id === c._id ? "#fff" : "#000"
                }}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* SKILLS */}
          <Text style={styles.label}>Skills</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {availableSkills.map(s => (
              <TouchableOpacity
                key={s._id}
                onPress={() =>
                  toggleSelection(s._id, selectedSkills, setSelectedSkills)
                }
                style={[
                  styles.chip,
                  selectedSkills.includes(s._id) && styles.activeChip
                ]}
              >
                <Text style={{
                  color: selectedSkills.includes(s._id) ? "#fff" : "#000"
                }}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* INTERESTS */}
          <Text style={styles.label}>Interests (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {availableInterests.map(i => (
              <TouchableOpacity
                key={i._id}
                onPress={() =>
                  toggleSelection(i._id, selectedInterests, setSelectedInterests)
                }
                style={[
                  styles.chip,
                  selectedInterests.includes(i._id) && styles.activeChip
                ]}
              >
                <Text style={{
                  color: selectedInterests.includes(i._id) ? "#fff" : "#000"
                }}>
                  {i.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* BUTTON */}
          <TouchableOpacity
            disabled={isDisabled || bookingLoading}
            style={[
              styles.findBtn,
              (isDisabled || bookingLoading) && styles.disabledBtn
            ]}
            onPress={handleFindBuddy}
          >
            {bookingLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                Confirm Booking
              </Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </View>

    </View>
  );
}

/*
STYLES
*/
const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: "#F6F7FB" },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },

  header: {
    padding: 20,
    paddingTop: 50
  },

  title: {
    fontSize: 22,
    fontWeight: "bold"
  },

  sub: {
    color: "#777",
    marginTop: 4
  },

  locationBox: {
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    elevation: 3
  },

  locationTitle: {
    fontWeight: "700",
    fontSize: 14
  },

  locationSub: {
    marginTop: 4,
    fontSize: 12,
    color: "#666"
  },

  panel: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 10,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 15
  },

  label: {
    fontWeight: "700",
    marginTop: 14
  },

  chip: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    margin: 5,
    borderRadius: 20
  },

  activeChip: {
    backgroundColor: "#4CAF50"
  },

  findBtn: {
    marginTop: 20,
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 15,
    alignItems: "center"
  },

  disabledBtn: {
    backgroundColor: "#ccc"
  }
});