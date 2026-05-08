import React, { useEffect, useState, useContext, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { SOCKET_EVENTS } from "../../../evenets/frontendsocketEvents.js";

import { SocketContext } from "../../context/socketContext.js";
import { LocationContext } from "../../context/LocationContext";

export default function MatchingScreen({ route, navigation }) {

  const bookingId = route?.params?.bookingId;

  const { socket, connected } = useContext(SocketContext);
  const { currentLocation } = useContext(LocationContext);

  const [status, setStatus] = useState(
    "Finding the best buddy..."
  );

  const [isError, setIsError] = useState(false);

  const timeoutRef = useRef(null);

  /*
  
  ANIMATION
  
  */
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.4,
            duration: 1200,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease)
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true
          })
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.2,
            duration: 1200,
            useNativeDriver: true
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.6,
            duration: 1200,
            useNativeDriver: true
          })
        ])
      ])
    );

    loop.start();
    return () => loop.stop();
  }, []);

  /*

  SOCKET FLOW

  */
  useEffect(() => {

    if (!socket || !bookingId) return;

    console.log(" Matching started:", bookingId);

    /*
  
    JOIN ROOM
   
    */
    socket.emit(SOCKET_EVENTS.BOOKING_JOIN, {
      bookingId
    });

    /*
   
    TIMEOUT (FAIL SAFE)
  
    */
    timeoutRef.current = setTimeout(() => {
      setIsError(true);
      setStatus("No buddies available nearby.");
    }, 25000);

    /*
  
    EVENTS
   
    */

    const onSearching = (data) => {
      if (data?.bookingId !== bookingId) return;

      setStatus("Searching nearby buddies...");
    };

    const onAccepted = async (data) => {
      if (data?.bookingId !== bookingId) return;

      console.log(" ACCEPTED:", data);

      clearTimeout(timeoutRef.current);

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      navigation.replace("Tracking", {
        bookingId: data.bookingId,
        buddy: data.buddy,
        userLocation: currentLocation
      });
    };

    const onConfirmed = (data) => {
      if (data?.bookingId !== bookingId) return;

      console.log(" CONFIRMED:", data);
      setStatus("Buddy confirmed. Preparing...");
    };

    const onStatusUpdate = (data) => {
      if (data?.bookingId !== bookingId) return;

      console.log(" STATUS UPDATE:", data.status);

      if (data.status === "searching") {
        setStatus("Searching nearby buddies...");
      }

      if (data.status === "assigned") {
        setStatus("Assigning buddy...");
      }
    };

    const onFailed = (data) => {
      if (data?.bookingId !== bookingId) return;

      clearTimeout(timeoutRef.current);

      setIsError(true);
      setStatus("No buddies found. Please try again.");
    };

    const onCancelled = (data) => {
      if (data?.bookingId !== bookingId) return;

      clearTimeout(timeoutRef.current);

      setIsError(true);
      setStatus("Booking was cancelled.");
    };

    /*
  
    SOCKET LISTENERS

    */

    socket.on(SOCKET_EVENTS.BOOKING_NEW, onSearching);
    socket.on(SOCKET_EVENTS.BOOKING_ACCEPTED, onAccepted);
    socket.on(SOCKET_EVENTS.BOOKING_CONFIRMED, onConfirmed);
    socket.on(SOCKET_EVENTS.STATUS_UPDATE, onStatusUpdate);
    socket.on(SOCKET_EVENTS.BOOKING_FAILED, onFailed);
    socket.on(SOCKET_EVENTS.BOOKING_CANCELLED, onCancelled);

    /*

    CLEANUP
  
    */
    return () => {

      clearTimeout(timeoutRef.current);

      socket.off(SOCKET_EVENTS.BOOKING_NEW, onSearching);
      socket.off(SOCKET_EVENTS.BOOKING_ACCEPTED, onAccepted);
      socket.off(SOCKET_EVENTS.BOOKING_CONFIRMED, onConfirmed);
      socket.off(SOCKET_EVENTS.STATUS_UPDATE, onStatusUpdate);
      socket.off(SOCKET_EVENTS.BOOKING_FAILED, onFailed);
      socket.off(SOCKET_EVENTS.BOOKING_CANCELLED, onCancelled);

      socket.emit(SOCKET_EVENTS.BOOKING_LEAVE, {
        bookingId
      });
    };

  }, [socket, bookingId, currentLocation]);

  /*

  UI
 
  */
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>

        {!isError ? (
          <>
            <View style={styles.animationWrapper}>
              <Animated.View
                style={[
                  styles.ripple,
                  {
                    transform: [{ scale: scaleAnim }],
                    opacity: opacityAnim
                  }
                ]}
              />
              <View style={styles.circle}>
                <Ionicons name="person" size={28} color="#fff" />
              </View>
            </View>

            <Text style={styles.title}>{status}</Text>

            <Text style={styles.sub}>
              {connected
                ? "Waiting for buddy to accept request"
                : "Reconnecting to server..."}
            </Text>
          </>
        ) : (
          <>
            <Ionicons name="alert-circle" size={70} color="red" />
            <Text style={styles.error}>{status}</Text>

            <TouchableOpacity
              style={styles.btn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.btnText}>Try Again</Text>
            </TouchableOpacity>
          </>
        )}

      </View>
    </SafeAreaView>
  );
}



// STYLES

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F6F7FB",
    justifyContent: "center",
    alignItems: "center"
  },

  card: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 24,
    alignItems: "center",
    elevation: 6
  },

  animationWrapper: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20
  },

  circle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute"
  },

  ripple: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#007AFF"
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
    textAlign: "center"
  },

  sub: {
    marginTop: 8,
    color: "#777",
    textAlign: "center",
    lineHeight: 20
  },

  error: {
    marginTop: 15,
    fontSize: 15,
    textAlign: "center"
  },

  btn: {
    marginTop: 20,
    backgroundColor: "#000",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10
  },

  btnText: {
    color: "#fff",
    fontWeight: "600"
  }

});