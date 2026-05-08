import React, {
  useEffect,
  useState,
  useContext,
  useCallback
} from "react";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl
} from "react-native";

import * as Location from "expo-location";

import api from "../../api/Apiclient.js";

import { SocketContext } from "../../context/socketContext.js";
import { LocationContext } from "../../context/LocationContext.js";

import { SOCKET_EVENTS } from "../../../evenets/frontendsocketEvents.js";

export default function HomeScreen({ navigation }) {

  const { socket } = useContext(SocketContext);

  const {
    currentLocation,
    selectedLocation
  } = useContext(LocationContext);

  

  // LOCATION
 
  
  const userLocation =
    selectedLocation ||
    currentLocation ||
    null;

  
 
  // STATES

  
  const [address, setAddress] = useState("");

  const [categories, setCategories] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [availableInterests, setAvailableInterests] = useState([]);

  const [selectedCategory, setSelectedCategory] =
    useState(null);

  const [selectedSkills, setSelectedSkills] =
    useState([]);

  const [selectedInterests, setSelectedInterests] =
    useState([]);

  const [loading, setLoading] = useState(true);

  const [bookingLoading, setBookingLoading] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  
  // LOAD INITIAL DATA

  const loadInitialData = async () => {

    try {

      const [catRes, intRes] = await Promise.all([
        api.get("/user/categories"),
        api.get("/user/interests")
      ]);

      setCategories(catRes?.data?.data || []);

      setAvailableInterests(
        intRes?.data?.data || []
      );

    } catch (err) {

      console.log(
        " Home data load error:",
        err?.response?.data || err.message
      );

      Alert.alert(
        "Error",
        "Failed to load data"
      );

    } finally {

      setLoading(false);
      setRefreshing(false);
    }
  };


 
  // INITIAL LOAD


  useEffect(() => {
    loadInitialData();
  }, []);

 
  // PULL TO REFRESH


  const onRefresh = useCallback(() => {

    setRefreshing(true);

    loadInitialData();

  }, []);

  
 
  // SOCKET EVENTS
 

useEffect(() => {
  if (!socket) return;


 
  // BOOKING CREATED (SEARCH STARTED)

  
  const onBookingNew = (data) => {
    console.log("🔍 SEARCH STARTED:", data);

    if (!data?.bookingId) return;

    navigation.navigate("Matching", {
      bookingId: data.bookingId,
      userLocation
    });
  };

  

  // BOOKING ACCEPTED

  
  const onAccepted = (data) => {
    if (!data?.bookingId) return;

    console.log(" BOOKING ACCEPTED:", data);

    navigation.navigate("Tracking", {
      bookingId: data.bookingId,
      buddy: data.buddy,
      userLocation
    });
  };

  

  // TRACKING STARTED (WORK START)

  
  const onTrackingStarted = (data) => {
    if (!data?.bookingId) return;

    console.log(" WORK STARTED:", data);

    navigation.navigate("Tracking", {
      bookingId: data.bookingId,
      buddy: data.buddy || {
        _id: data.buddyId
      },
      userLocation
    });
  };



  // STATUS UPDATE (REALTIME)
  
  const onStatusUpdate = (data) => {
    console.log(" STATUS update:", data);

    // Optional: update UI or state if needed
  };

  /*

  WORK COMPLETED

  */
const onWorkCompleted = (data) => {
  console.log(" WORK COMPLETED IN HOME:", data);

  if (!data?.bookingId) return;

  navigation.navigate("UserReview", {
    bookingId: data.bookingId,
    buddy: data.buddy || {
      _id: data.buddyId,
      name: "Buddy"
    }
  });
};
  

  // TRACKING ENDED
  
  
  const onTrackingEnded = () => {
    Alert.alert(
      "Completed",
      "Tracking ended"
    );

    navigation.navigate("Home");
  };

  

  // BOOKING FAILED

  
  const onBookingFailed = (data) => {
    Alert.alert(
      "No Buddy Found",
      data?.message ||
        "No nearby buddies available"
    );
  };



  // BOOKING CANCELLED

 
  const onBookingCancelled = (data) => {
    Alert.alert(
      "Booking Cancelled",
      data?.reason ||
        "Your booking has been cancelled"
    );

    navigation.navigate("Home");
  };

  

  // SOCKET LISTENERS

  
  socket.on(SOCKET_EVENTS.BOOKING_NEW, onBookingNew);
  socket.on(SOCKET_EVENTS.BOOKING_ACCEPTED, onAccepted);
  socket.on(SOCKET_EVENTS.TRACKING_STARTED, onTrackingStarted);
  socket.on(SOCKET_EVENTS.STATUS_UPDATE, onStatusUpdate);
  socket.on(SOCKET_EVENTS.WORK_COMPLETED, onWorkCompleted);
  socket.on(SOCKET_EVENTS.TRACKING_ENDED, onTrackingEnded);
  socket.on(SOCKET_EVENTS.BOOKING_FAILED, onBookingFailed);
  socket.on(SOCKET_EVENTS.BOOKING_CANCELLED, onBookingCancelled);

  /*

  CLEANUP

  */
  return () => {
    socket.off(SOCKET_EVENTS.BOOKING_NEW, onBookingNew);
    socket.off(SOCKET_EVENTS.BOOKING_ACCEPTED, onAccepted);
    socket.off(SOCKET_EVENTS.TRACKING_STARTED, onTrackingStarted);
    socket.off(SOCKET_EVENTS.STATUS_UPDATE, onStatusUpdate);
    socket.off(SOCKET_EVENTS.WORK_COMPLETED, onWorkCompleted);
    socket.off(SOCKET_EVENTS.TRACKING_ENDED, onTrackingEnded);
    socket.off(SOCKET_EVENTS.BOOKING_FAILED, onBookingFailed);
    socket.off(SOCKET_EVENTS.BOOKING_CANCELLED, onBookingCancelled);
  };

}, [socket, userLocation]);

  /*
  
  REVERSE GEOCODE

  */
  useEffect(() => {

    const fetchAddress = async () => {

      if (!userLocation) return;

      try {

        const result =
          await Location.reverseGeocodeAsync({
            latitude: userLocation.latitude,
            longitude: userLocation.longitude
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

        console.log(
          " Reverse geocode error:",
          err
        );
      }
    };

    fetchAddress();

  }, [userLocation]);

  

  // LOAD SKILLS

  
  useEffect(() => {

    if (!selectedCategory?._id) {

      setAvailableSkills([]);
      setSelectedSkills([]);

      return;
    }

    const loadSkills = async () => {

      try {

        const res = await api.get(
          `/user/skills/${selectedCategory._id}`
        );

        setAvailableSkills(
          res?.data?.data || []
        );

      } catch (err) {

        console.log(
          " Skill load error:",
          err
        );

        setAvailableSkills([]);
      }
    };

    loadSkills();

  }, [selectedCategory]);

  

  // TOGGLE SELECT

  
  const toggleSelection = (
    id,
    list,
    setList
  ) => {

    setList(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  
  // VALIDATION

  
  const isDisabled =
    !selectedCategory ||
    selectedSkills.length === 0 ||
    !userLocation;



  // FIND BUDDY

  
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

        fullAddress:
          address || "Unknown location",

        price: 0
      };

      console.log(
        " BOOKING PAYLOAD:",
        payload
      );

      const res = await api.post(
        "/booking/request",
        payload
      );

      if (!res?.data?.success) {
        
        Alert.alert(
          "Booking Failed",
          res?.data?.message ||
            "Something went wrong"
        );
        

        return;
      }

      console.log(
        " BOOKING CREATED:",
        res.data
      );

      navigation.navigate("Matching", {
        bookingId: res.data.bookingId,
        userLocation
      });

    } catch (err) {

      console.log(
        " Booking error:",
        err?.response?.data || err.message
      );

      Alert.alert(
        "Booking Failed",
        err?.response?.data?.message ||
          "Server error"
      );

    } finally {

      setBookingLoading(false);
    }
  };

  
 
  // LOADING
  
  
  if (loading || !userLocation) {

    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  

  // UI

  
  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>

        <Text style={styles.title}>
          Find a Buddy
        </Text>

        <Text style={styles.sub}>
          Select category, skills & interests
        </Text>

      </View>

      {/* { LOCATION } */}
      <TouchableOpacity
        style={styles.locationBox}
        onPress={() =>
          navigation.navigate("SelectLocation")
        }
      >

        <Text style={styles.locationTitle}>
          📍
          {selectedLocation
            ? " Selected Location"
            : " Current Location"}
        </Text>

        <Text style={styles.locationSub}>
          {address || "Fetching address..."}
        </Text>

      </TouchableOpacity>

      {/* PANEL */}
      <View style={styles.panel}>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        >

          {/* CATEGORY */}
          <Text style={styles.label}>
            Category
          </Text>

          <ScrollView horizontal>

            {categories.map(category => (

              <TouchableOpacity
                key={category._id}
                onPress={() =>
                  setSelectedCategory(category)
                }
                style={[
                  styles.chip,
                  selectedCategory?._id ===
                    category._id &&
                    styles.activeChip
                ]}
              >

                <Text
                  style={{
                    color:
                      selectedCategory?._id ===
                      category._id
                        ? "#fff"
                        : "#000"
                  }}
                >
                  {category.name}
                </Text>

              </TouchableOpacity>
            ))}

          </ScrollView>

          {/* SKILLS */}
          <Text style={styles.label}>
            Skills
          </Text>

          <ScrollView horizontal>

            {availableSkills.map(skill => (

              <TouchableOpacity
                key={skill._id}
                onPress={() =>
                  toggleSelection(
                    skill._id,
                    selectedSkills,
                    setSelectedSkills
                  )
                }
                style={[
                  styles.chip,
                  selectedSkills.includes(
                    skill._id
                  ) && styles.activeChip
                ]}
              >

                <Text
                  style={{
                    color:
                      selectedSkills.includes(
                        skill._id
                      )
                        ? "#fff"
                        : "#000"
                  }}
                >
                  {skill.name}
                </Text>

              </TouchableOpacity>
            ))}

          </ScrollView>

          {/* INTERESTS */}
          <Text style={styles.label}>
            Interests
          </Text>

          <ScrollView horizontal>

            {availableInterests.map(
              interest => (

                <TouchableOpacity
                  key={interest._id}
                  onPress={() =>
                    toggleSelection(
                      interest._id,
                      selectedInterests,
                      setSelectedInterests
                    )
                  }
                  style={[
                    styles.chip,
                    selectedInterests.includes(
                      interest._id
                    ) && styles.activeChip
                  ]}
                >

                  <Text
                    style={{
                      color:
                        selectedInterests.includes(
                          interest._id
                        )
                          ? "#fff"
                          : "#000"
                    }}
                  >
                    {interest.name}
                  </Text>

                </TouchableOpacity>
              )
            )}

          </ScrollView>

          {/* BUTTON */}
          <TouchableOpacity
            disabled={
              isDisabled || bookingLoading
            }
            style={[
              styles.findBtn,
              (isDisabled ||
                bookingLoading) &&
                styles.disabledBtn
            ]}
            onPress={handleFindBuddy}
          >

            {bookingLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.findBtnText}>
                Confirm Booking
              </Text>
            )}

          </TouchableOpacity>

        </ScrollView>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F6F7FB"
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },

  header: {
    padding: 20,
    paddingTop: 55
  },

  title: {
    fontSize: 24,
    fontWeight: "bold"
  },

  sub: {
    marginTop: 5,
    color: "#777"
  },

  locationBox: {
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    elevation: 3
  },

  locationTitle: {
    fontWeight: "700",
    fontSize: 14
  },

  locationSub: {
    marginTop: 5,
    fontSize: 12,
    color: "#666"
  },

  panel: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 12,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 16
  },

  label: {
    fontWeight: "700",
    marginTop: 15,
    marginBottom: 5
  },

  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#F0F0F0",
    marginRight: 8,
    marginVertical: 5,
    borderRadius: 25
  },

  activeChip: {
    backgroundColor: "#4CAF50"
  },

  findBtn: {
    marginTop: 25,
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 30
  },

  disabledBtn: {
    backgroundColor: "#C7C7C7"
  },

  findBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15
  }

});