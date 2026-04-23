import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';

import { Ionicons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';

import { SafeAreaView } from 'react-native-safe-area-context';
import { SocketContext } from '../../context/socketContext.js';

export default function MatchingScreen({ route, navigation }) {

  const { bookingId } = route.params;
  const { socket, isConnected } = useContext(SocketContext);

  const [status, setStatus] =
    useState("Finding the best buddy...");

  const [isError, setIsError] = useState(false);

  /*
  ============================
  SOCKET LISTENERS
  ============================
  */
  useEffect(() => {

    if (!socket) return;

    console.log("🎧 Listening booking events...");

    // ========================
    // BOOKING ACCEPTED
    // ========================
    socket.on("booking-accepted", async (data) => {

      console.log("✅ booking accepted", data);

      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );

      // GET USER LOCATION
      const loc =
        await Location.getCurrentPositionAsync({});

      const userLocation = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      };

      // NAVIGATE TO TRACKING SCREEN
      navigation.replace("Tracking", {
        bookingId: data.bookingId,
        buddy: data.buddy,
        userLocation
      });

    });

    // ========================
    // BOOKING FAILED
    // ========================
    socket.on("booking-failed", () => {

      console.log("❌ booking failed");

      setIsError(true);
      setStatus("No buddies available right now.");

    });

    return () => {
      socket.off("booking-accepted");
      socket.off("booking-failed");
    };

  }, [socket]);

  /*
  ============================
  UI
  ============================
  */
  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.content}>

        {!isError ? (
          <>
            <ActivityIndicator
              size="large"
              color="#007AFF"
            />

            <Text style={styles.statusText}>
              {status}
            </Text>

            <Text style={styles.subText}>
              {isConnected
                ? "Searching nearby..."
                : "Connecting..."}
            </Text>
          </>
        ) : (
          <>
            <Ionicons
              name="alert-circle"
              size={80}
              color="#FF3B30"
            />

            <Text style={styles.errorText}>
              {status}
            </Text>

            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.retryText}>
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
backgroundColor:"#fff"
},

content:{
flex:1,
justifyContent:"center",
alignItems:"center"
},

statusText:{
marginTop:20,
fontSize:18,
fontWeight:"600"
},

subText:{
marginTop:10,
color:"#777"
},

errorText:{
marginTop:20,
fontSize:16,
textAlign:"center"
},

retryBtn:{
marginTop:30,
backgroundColor:"#000",
padding:15,
borderRadius:10
},

retryText:{
color:"#fff"
}

}); 