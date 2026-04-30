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

import { SocketContext } from "../../context/socketContext.js";
import { LocationContext } from "../../context/LocationContext";

export default function MatchingScreen({ route, navigation }) {

  const bookingId = route?.params?.bookingId;

  const { socket, isConnected } = useContext(SocketContext);
  const { currentLocation } = useContext(LocationContext);

  const [status, setStatus] = useState("Finding the best buddy...");
  const [isError, setIsError] = useState(false);

  const timeoutRef = useRef(null);

  /*
  ============================
  ANIMATION
  ============================
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

    return () => loop.stop(); // ✅ cleanup
  }, []);

  /*
  ============================
  TIMEOUT (VERY IMPORTANT)
  ============================
  */
  useEffect(() => {

    timeoutRef.current = setTimeout(() => {
      setIsError(true);
      setStatus("No buddies found. Try again.");
    }, 20000); // 20 sec

    return () => clearTimeout(timeoutRef.current);

  }, []);

  /*
  ============================
  SOCKET FLOW
  ============================
  */
  useEffect(() => {

    if (!socket) return;

    const onSearching = () => {
      setStatus("Searching nearby buddies...");
    };

    const onAccepted = async (data) => {

      clearTimeout(timeoutRef.current);

      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      navigation.replace("Tracking", {
        bookingId: data.bookingId || bookingId,
        buddy: data.buddy,
        userLocation: currentLocation // ✅ use context instead
      });
    };

    const onFailed = () => {
      clearTimeout(timeoutRef.current);
      setIsError(true);
      setStatus("No buddies available right now.");
    };

    socket.on("booking-searching", onSearching);
    socket.on("booking-accepted", onAccepted);
    socket.on("booking-failed", onFailed);

    return () => {
      socket.off("booking-searching", onSearching);
      socket.off("booking-accepted", onAccepted);
      socket.off("booking-failed", onFailed);
    };

  }, [socket, currentLocation]);

  /*
  ============================
  UI
  ============================
  */
  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.card}>

        {!isError ? (
          <>
            {/* Animation */}
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

            <Text style={styles.title}>
              {status}
            </Text>

            <Text style={styles.sub}>
              {isConnected
                ? "Waiting for buddy to accept your request"
                : "Reconnecting to server..."}
            </Text>
          </>
        ) : (
          <>
            <Ionicons
              name="alert-circle"
              size={70}
              color="red"
            />

            <Text style={styles.error}>
              {status}
            </Text>

            <TouchableOpacity
              style={styles.btn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.btnText}>
                Try Again
              </Text>
            </TouchableOpacity>
          </>
        )}

      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:"#F6F7FB",
    justifyContent:"center",
    alignItems:"center"
  },

  card:{
    width:"90%",
    backgroundColor:"#fff",
    padding:30,
    borderRadius:24,
    alignItems:"center",
    elevation:6
  },

  animationWrapper:{
    width:120,
    height:120,
    justifyContent:"center",
    alignItems:"center",
    marginBottom:20
  },

  circle:{
    width:70,
    height:70,
    borderRadius:35,
    backgroundColor:"#007AFF",
    justifyContent:"center",
    alignItems:"center",
    position:"absolute"
  },

  ripple:{
    position:"absolute",
    width:120,
    height:120,
    borderRadius:60,
    backgroundColor:"#007AFF"
  },

  title:{
    fontSize:18,
    fontWeight:"700",
    marginTop:10,
    textAlign:"center"
  },

  sub:{
    marginTop:8,
    color:"#777",
    textAlign:"center",
    lineHeight:20
  },

  error:{
    marginTop:15,
    fontSize:15,
    textAlign:"center"
  },

  btn:{
    marginTop:20,
    backgroundColor:"#000",
    paddingVertical:12,
    paddingHorizontal:30,
    borderRadius:10
  },

  btnText:{
    color:"#fff",
    fontWeight:"600"
  }

});