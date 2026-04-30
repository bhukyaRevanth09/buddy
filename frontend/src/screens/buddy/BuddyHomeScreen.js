import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../context/AuthContext.js";
import { SocketContext } from "../../context/socketContext.js";
import api from "../../api/Apiclient.js";
import { useBuddySocket } from "../../../hooks/buddySocket.js";

export default function BuddyHome({ navigation }) {

  const { user, logout } = useAuth();
  const { socket } = useContext(SocketContext);

  const [isOnline, setIsOnline] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    earnings: 0,
    completedJobs: 0,
    rating: 4.8
  });

  /*
  ======================
  SOCKET
  ======================
  */
  useBuddySocket({
    socket,
    isOnline,
    setIncomingRequest
  });

  /*
  ======================
  LOAD DATA
  ======================
  */
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/buddy/dashboard");

        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /*
  ======================
  TOGGLE STATUS
  ======================
  */
  const toggleStatus = async () => {
    try {
      const newStatus = !isOnline;
      setIsOnline(newStatus);

      socket?.emit("buddy:status", { isOnline: newStatus });

      await api.patch("/buddy/toggle-status", {
        status: newStatus ? "available" : "offline"
      });

    } catch {
      setIsOnline(!isOnline);
      Alert.alert("Error updating status");
    }
  };

  /*
  ======================
  ACCEPT REQUEST
  ======================
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
  ======================
  LOGOUT
  ======================
  */
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel" },
      { text: "Logout", onPress: logout }
    ]);
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

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.name}>Hi, {user?.name}</Text>
            <Text style={styles.sub}>Buddy Dashboard</Text>
          </View>

          <TouchableOpacity onPress={toggleStatus} style={[
            styles.statusBtn,
            { backgroundColor: isOnline ? "#34C759" : "#999" }
          ]}>
            <Text style={styles.statusText}>
              {isOnline ? "ONLINE" : "OFFLINE"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>₹ {stats.earnings}</Text>
            <Text style={styles.cardSub}>Earnings</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{stats.completedJobs}</Text>
            <Text style={styles.cardSub}>Jobs</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>⭐ {stats.rating}</Text>
            <Text style={styles.cardSub}>Rating</Text>
          </View>

        </View>

        {/* ACTIVE JOB */}
        {activeBooking ? (
          <View style={styles.activeCard}>
            <Text style={styles.sectionTitle}>Active Job</Text>

            <Text style={styles.text}>
              Customer: {activeBooking?.customerName}
            </Text>

            <Text style={styles.text}>
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
              <Text style={styles.goText}>GO TO JOB</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.waitCard}>
            <Ionicons name="time-outline" size={40} color="#999" />
            <Text style={styles.waitText}>Waiting for bookings...</Text>
          </View>
        )}

        {/* LOGOUT */}
        <TouchableOpacity style={styles.logout} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="red" />
          <Text style={{ color: "red", marginLeft: 5 }}>Logout</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* REQUEST MODAL */}
      <Modal visible={!!incomingRequest} transparent animationType="fade">
        <View style={styles.modal}>
          <View style={styles.modalCard}>

            <Text style={styles.modalTitle}>New Booking Request</Text>

            <Text style={styles.modalText}>
              Distance: {incomingRequest?.distance} km
            </Text>

            <Text style={styles.modalText}>
              Address: {incomingRequest?.address}
            </Text>

            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={handleAccept}
            >
              <Text style={styles.acceptText}>ACCEPT</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

/*
======================
STYLES (CLEAN UI)
======================
*/
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F6F7FB",
    padding: 15
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },

  name: {
    fontSize: 22,
    fontWeight: "bold"
  },

  sub: {
    color: "#666"
  },

  statusBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20
  },

  statusText: {
    color: "#fff",
    fontWeight: "bold"
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20
  },

  card: {
    flex: 1,
    margin: 5,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    elevation: 3
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "bold"
  },

  cardSub: {
    color: "#777",
    marginTop: 5
  },

  activeCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    elevation: 3
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10
  },

  text: {
    color: "#555"
  },

  goBtn: {
    marginTop: 10,
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 10
  },

  goText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold"
  },

  waitCard: {
    alignItems: "center",
    padding: 30,
    backgroundColor: "#fff",
    borderRadius: 12
  },

  waitText: {
    marginTop: 10,
    color: "#777"
  },

  logout: {
    flexDirection: "row",
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center"
  },

  modal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)"
  },

  modalCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "85%"
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "bold"
  },

  modalText: {
    marginTop: 5
  },

  acceptBtn: {
    marginTop: 15,
    backgroundColor: "#34C759",
    padding: 12,
    borderRadius: 10
  },

  acceptText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold"
  }
});