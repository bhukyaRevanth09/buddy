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

import MapView, {
  Circle,
  Marker,
  PROVIDER_GOOGLE
} from "react-native-maps";

import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../context/AuthContext.js";
import { SocketContext } from "../../context/socketContext.js";
import api from "../../api/Apiclient.js";

import { useBuddySocket } from "../../../hooks/buddySocket.js";
import { useLiveTracking } from "../../../hooks/useLiveLocation.js";

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
  ===============================
  LIVE TRACKING
  ===============================
  */
  const buddyLocation = useLiveTracking(
    socket,
    activeBooking?._id
  );

  /*
  ===============================
  SOCKET LISTENER
  ===============================
  */
  useBuddySocket({
    socket,
    isOnline,
    setIncomingRequest
  });

  /*
  ===============================
  GET CURRENT LOCATION
  ===============================
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
  ===============================
  TOGGLE STATUS
  ===============================
  */
  const toggleStatus = async () => {

    try {

      const newStatus = !isOnline;
      setIsOnline(newStatus);

      socket?.emit("buddy:status", {
        isOnline: newStatus
      });

      const res = await api.patch("/buddy/toggle-status", {
        status: newStatus
      });

      if (!res.data.success) {
        setIsOnline(!newStatus);
      }

    } catch {
      setIsOnline(!isOnline);
      Alert.alert("Error updating status");
    }
  };

  /*
  ===============================
  ACCEPT BOOKING
  ===============================
  */
  const handleAccept = async () => {

    try {

      const res = await api.post("/booking/accept", {
        bookingId: incomingRequest.bookingId
      });

      if (res.data.success) {

        setActiveBooking(res.data.data);
        setIncomingRequest(null);

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
  ===============================
  LOGOUT
  ===============================
  */
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure?",
      [
        { text: "Cancel" },
        { text: "Logout", onPress: logout }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

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

        {buddyLocation && (
          <Marker
            coordinate={buddyLocation}
            title="Live Location"
            pinColor="green"
          />
        )}

      </MapView>

      {/* DASHBOARD */}
      <View style={styles.dashboard}>

        {/* HEADER */}
        <View style={styles.topRow}>

          <View>
            <Text style={styles.name}>
              {user?.name}
            </Text>

            <Text style={styles.sub}>
              Buddy Dashboard
            </Text>
          </View>

          <View style={styles.headerRight}>

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
              style={styles.logout}
              onPress={handleLogout}
            >
              <Ionicons
                name="log-out-outline"
                size={22}
                color="#ff3b30"
              />
            </TouchableOpacity>

          </View>
        </View>

        {/* ACTIVE BOOKING */}
        {activeBooking ? (
          <View style={styles.jobCard}>

            <Text style={styles.jobTitle}>
              Active Booking
            </Text>

            <Text style={styles.jobText}>
              Customer: {activeBooking?.customerName}
            </Text>

            <Text style={styles.jobText}>
              Category: {activeBooking?.categoryName}
            </Text>

            <TouchableOpacity
              style={styles.goBtn}
              onPress={() =>
                navigation.navigate("ActiveJob", {
                  booking: activeBooking
                })
              }
            >
              <Text style={styles.goText}>
                GO TO JOB
              </Text>
            </TouchableOpacity>

          </View>
        ) : (
          <View style={styles.waitCard}>
            <Text style={styles.waitText}>
              Waiting for bookings...
            </Text>
          </View>
        )}

      </View>

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

const styles = StyleSheet.create({
container:{flex:1},
map:{flex:1},

dashboard:{
position:"absolute",
top:0,
left:0,
right:0,
padding:15
},

topRow:{
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center",
backgroundColor:"#fff",
padding:12,
borderRadius:12,
elevation:3
},

headerRight:{
flexDirection:"row",
alignItems:"center"
},

name:{
fontSize:18,
fontWeight:"bold"
},

sub:{
fontSize:12,
color:"#666"
},

statusBtn:{
paddingHorizontal:12,
paddingVertical:6,
borderRadius:8,
marginRight:10
},

statusText:{
color:"#fff",
fontWeight:"bold"
},

logout:{
padding:5
},

jobCard:{
marginTop:10,
backgroundColor:"#fff",
padding:15,
borderRadius:12,
elevation:3
},

jobTitle:{
fontSize:16,
fontWeight:"bold",
marginBottom:5
},

jobText:{
color:"#555",
marginBottom:3
},

goBtn:{
backgroundColor:"#007AFF",
padding:10,
borderRadius:8,
marginTop:8
},

goText:{
color:"#fff",
textAlign:"center",
fontWeight:"bold"
},

waitCard:{
marginTop:10,
backgroundColor:"#fff",
padding:12,
borderRadius:10
},

waitText:{
textAlign:"center",
color:"#666"
},

center:{
flex:1,
justifyContent:"center",
alignItems:"center"
},

modal:{
flex:1,
justifyContent:"center",
alignItems:"center",
backgroundColor:"rgba(0,0,0,0.5)"
},

card:{
backgroundColor:"#fff",
padding:20,
borderRadius:12,
width:"85%"
},

title:{
fontSize:18,
fontWeight:"bold",
marginBottom:10
},

info:{
marginBottom:6
},

accept:{
backgroundColor:"#34C759",
padding:12,
borderRadius:10,
marginTop:10
},

acceptText:{
color:"#fff",
textAlign:"center",
fontWeight:"bold"
}
});