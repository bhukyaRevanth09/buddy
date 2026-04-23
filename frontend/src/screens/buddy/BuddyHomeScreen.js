import React, { useState, useRef, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from "react-native";

import MapView, { Circle, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";

import { useAuth } from "../../context/AuthContext.js";
import { SocketContext } from "../../context/socketContext.js";
import api from "../../api/Apiclient.js";

import { useBuddySocket } from "../../../hooks/buddySocket.js";
import { useLiveLocation } from "../../../hooks/useLiveLocation.js";

export default function BuddyHome({ navigation }) {

  const { user, logout } = useAuth();
  const { socket } = useContext(SocketContext);

  const mapRef = useRef(null);

  const [isOnline, setIsOnline] = useState(user?.isOnline || false);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeBooking, setActiveBooking] = useState(null);

  /*
  ================================
  SOCKET LISTENER
  ================================
  */
  useBuddySocket({
    socket,
    isOnline,
    setIncomingRequest
  });

  /*
  ================================
  REALTIME STATUS SYNC
  ================================
  */
  useEffect(() => {
    if (!socket) return;

    socket.on("buddy_status_updated", (data) => {
      if (data.buddyId === user?._id) {
        setIsOnline(data.isOnline);
      }
    });

    return () => {
      socket.off("buddy_status_updated");
    };

  }, [socket]);


  /*
  ================================
  LIVE LOCATION
  ================================
  */
  useLiveLocation({
    socket,
    isOnline,
    activeBooking
  });


  /*
  ================================
  GET CURRENT LOCATION
  ================================
  */
  useEffect(() => {
    (async () => {

      let { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission required");
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };

      setLocation(coords);
      setLoading(false);

    })();
  }, []);


  /*
  ================================
  TOGGLE ONLINE STATUS
  ================================
  */
  const toggleStatus = async () => {
    try {

      const newStatus = !isOnline;

      setIsOnline(newStatus); // optimistic UI

      const res = await api.patch("/buddy/toggle-status", {
        status: newStatus
      });

      if (!res.data.success) {
        setIsOnline(!newStatus);
      }

    } catch (err) {

      setIsOnline(!isOnline);

      console.log(
        "TOGGLE ERROR",
        err?.response?.data || err.message
      );

      Alert.alert("Error updating status");
    }
  };


  /*
  ================================
  LOGOUT
  ================================
  */
  const handleLogout = async () => {
    try {
      await api.patch("/buddy/toggle-status", {
        status: false
      });
    } catch {}

    logout();
  };


  /*
  ================================
  ACCEPT BOOKING
  ================================
  */
  const handleAccept = async () => {
    try {

      const res = await api.post("/booking/accept", {
        bookingId: incomingRequest.bookingId
      });

      if (res.data.success) {

        setActiveBooking(res.data.data);
        setIncomingRequest(null);

        socket.emit(
          "track_booking",
          res.data.data._id
        );

        navigation.navigate("ActiveJob", {
          booking: res.data.data
        });
      }

    } catch {
      Alert.alert("Already taken");
      setIncomingRequest(null);
    }
  };


  /*
  ================================
  LOADING
  ================================
  */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }


  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>

        <View>
          <Text style={styles.name}>
            {user?.name}
          </Text>

          <Text style={styles.sub}>
            Buddy Dashboard
          </Text>
        </View>

        <View style={styles.rightHeader}>

          <TouchableOpacity
            style={[
              styles.statusBtn,
              { backgroundColor: isOnline ? "#34C759" : "#999" }
            ]}
            onPress={toggleStatus}
          >
            <Text style={styles.statusText}>
              {isOnline ? "ONLINE" : "OFFLINE"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>
              Logout
            </Text>
          </TouchableOpacity>

        </View>
      </View>


      {/* MAP */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        showsUserLocation
        initialRegion={location}
      >
        {location && (
          <Circle
            center={location}
            radius={2000}
            fillColor="rgba(0,122,255,0.1)"
          />
        )}
      </MapView>


      {/* BOOKING MODAL */}
      <Modal visible={!!incomingRequest} transparent>
        <View style={styles.modal}>
          <View style={styles.card}>

            <Text style={styles.title}>
              New Booking Request
            </Text>

            <Text style={styles.info}>
              Customer: {incomingRequest?.customerName}
            </Text>

            <Text style={styles.info}>
              Category: {incomingRequest?.categoryName}
            </Text>

            <Text style={styles.info}>
              Distance: {incomingRequest?.distance} km
            </Text>

            <TouchableOpacity
              style={styles.accept}
              onPress={handleAccept}
            >
              <Text style={styles.acceptText}>
                ACCEPT BOOKING
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}