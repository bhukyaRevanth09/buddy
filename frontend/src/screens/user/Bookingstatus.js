import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert
} from "react-native";

import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import { SocketContext } from "../../context/socketContext.js";
import api from "../../api/Apiclient.js";

export default function BookingStatus({ route, navigation }) {
  const { bookingId, buddy } = route.params;
  const { socket } = useContext(SocketContext);

  const [status, setStatus] = useState("accepted");
  const [buddyLocation, setBuddyLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  /*
  ===============================
  SOCKET LISTENERS
  ===============================
  */
  useEffect(() => {
    if (!socket) return;

    socket.emit("join_booking_room", bookingId);

    // live location
    socket.on("location_update", (data) => {
      if (data.bookingId === bookingId) {
        setBuddyLocation({
          latitude: data.location?.latitude || data.lat,
          longitude: data.location?.longitude || data.lng
        });
      }
    });

    // booking started
    socket.on("booking-started", () => {
      setStatus("started");
    });

    // booking completed
    socket.on("booking-completed", () => {
      setStatus("completed");
    });

    return () => {
      socket.off("location_update");
      socket.off("booking-started");
      socket.off("booking-completed");
    };
  }, [socket]);

  /*
  ===============================
  LOAD BOOKING STATUS
  ===============================
  */
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const res = await api.get(`/booking/status/${bookingId}`);

        if (res.data.success) {
          setStatus(res.data.data.status);
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    loadStatus();
  }, []);

  /*
  ===============================
  CALL BUDDY
  ===============================
  */
  const callBuddy = () => {
    Linking.openURL(`tel:${buddy.phone}`);
  };

  /*
  ===============================
  CANCEL BOOKING
  ===============================
  */
  const cancelBooking = async () => {
    try {
      await api.post("/booking/cancel", {
        bookingId
      });

      Alert.alert("Booking cancelled");
      navigation.popToTop();

    } catch {
      Alert.alert("Cancel failed");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* MAP */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        showsUserLocation
      >
        {buddyLocation && (
          <Marker
            coordinate={buddyLocation}
            title={buddy.name}
          />
        )}
      </MapView>

      {/* BOTTOM CARD */}
      <View style={styles.card}>

        <Text style={styles.title}>
          {status.toUpperCase()}
        </Text>

        <Text style={styles.name}>
          {buddy.name}
        </Text>

        <Text style={styles.rating}>
          ⭐ {buddy.rating}
        </Text>

        <View style={styles.row}>

          <TouchableOpacity
            style={styles.callBtn}
            onPress={callBuddy}
          >
            <Text style={styles.btnText}>
              CALL
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={cancelBooking}
          >
            <Text style={styles.btnText}>
              CANCEL
            </Text>
          </TouchableOpacity>

        </View>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({

container:{
flex:1
},

map:{
flex:1
},

center:{
flex:1,
justifyContent:"center",
alignItems:"center"
},

card:{
position:"absolute",
bottom:0,
left:0,
right:0,
backgroundColor:"#fff",
padding:20,
borderTopLeftRadius:20,
borderTopRightRadius:20
},

title:{
fontSize:18,
fontWeight:"700"
},

name:{
fontSize:16,
marginTop:5
},

rating:{
marginTop:5,
color:"#666"
},

row:{
flexDirection:"row",
marginTop:15
},

callBtn:{
flex:1,
backgroundColor:"#34C759",
padding:15,
borderRadius:10,
marginRight:10,
alignItems:"center"
},

cancelBtn:{
flex:1,
backgroundColor:"#FF3B30",
padding:15,
borderRadius:10,
alignItems:"center"
},

btnText:{
color:"#fff",
fontWeight:"600"
}

});