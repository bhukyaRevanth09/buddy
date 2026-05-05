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
import { SOCKET_EVENTS } from "../../../evenets/frontendsocketEvents.js";
import { useBuddySocket } from "../../../hooks/useBuddySocket.js";

export default function BuddyHome({ navigation }) {
  const { user, logout } = useAuth();
  const { socket } = useContext(SocketContext);

  const [isOnline, setIsOnline] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    completedJobs: 0,
    rating: 0
  });

  /*
  ======================
  SOCKET HOOK
  ======================
  */
  useBuddySocket({
    socket,
    isOnline,
    setIncomingRequest
  });

  /*
  ======================
  LOAD DASHBOARD
  ======================
  */
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await api.get("/buddy/dashboard");

        console.log("📊 DASHBOARD RESPONSE:", res.data);

        if (res.data.success) {
          setStats(res.data.data);
          setIsOnline(res.data.data?.isOnline || false);

          if (res.data.data?.activeBooking) {
            setActiveBooking(res.data.data.activeBooking);
          }
        }
      } catch (err) {
        console.log("❌ DASHBOARD ERROR:", err?.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
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

      console.log("🔄 STATUS UPDATE:", newStatus);

      socket?.emit(SOCKET_EVENTS.STATUS_UPDATE, {
        isOnline: newStatus
      });

      await api.patch("/buddy/toggle-status", {
        status: newStatus ? "available" : "offline"
      });
    } catch (err) {
      console.log("❌ STATUS ERROR:", err?.response?.data || err.message);
      setIsOnline((prev) => !prev);
      Alert.alert("Error", "Failed to update status");
    }
  };

  /*
  ======================
  ACCEPT BOOKING
  ======================
  */
const handleAccept = async () => {
  if (!incomingRequest) return;

  try {
    const requestToAccept = incomingRequest;

    // ✅ close popup immediately
    setIncomingRequest(null);

    const res = await api.post("/booking/accept", {
      bookingId: requestToAccept.bookingId
    });

    if (res.data.success) {
      const realBookingId = res.data.bookingId || requestToAccept.bookingId;

      const bookingData = {
        ...requestToAccept,
        bookingId: realBookingId,
        _id: realBookingId,
        status: "accepted",
        pickupLocation: requestToAccept.pickupLocation
      };

      setActiveBooking(bookingData);

      socket?.emit(SOCKET_EVENTS.BOOKING_JOIN, {
        bookingId: realBookingId
      });

      navigation.navigate("ActiveJob", {
        booking: bookingData
      });
    }
  } catch (err) {
    console.log("❌ ACCEPT ERROR:", err?.response?.data || err.message);
    setIncomingRequest(null);
    Alert.alert("Error", err?.response?.data?.message || "Accept failed");
  }
};
  /*
  ======================
  REJECT BOOKING
  ======================
  */
  const handleReject = () => {
    if (!incomingRequest) return;

    console.log("❌ REJECT BOOKING:", incomingRequest.bookingId);

    socket?.emit(SOCKET_EVENTS.BOOKING_REJECTED, {
      bookingId: incomingRequest.bookingId
    });

    setIncomingRequest(null);
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
        <View style={styles.header}>
          <View>
            <Text style={styles.name}>Hi, {user?.name}</Text>
            <Text style={styles.sub}>Buddy Dashboard</Text>
          </View>

          <TouchableOpacity
            onPress={toggleStatus}
            style={[
              styles.statusBtn,
              { backgroundColor: isOnline ? "#34C759" : "#999" }
            ]}
          >
            <Text style={styles.statusText}>
              {isOnline ? "ONLINE" : "OFFLINE"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{stats.completedJobs}</Text>
            <Text style={styles.cardSub}>Jobs</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>⭐ {stats.rating}</Text>
            <Text style={styles.cardSub}>Rating</Text>
          </View>
        </View>

        {activeBooking ? (
          <View style={styles.activeCard}>
            <Text style={styles.sectionTitle}>Active Job</Text>

            <Text style={styles.text}>
              Customer: {activeBooking?.customerName || "Customer"}
            </Text>

            <Text style={styles.text}>
              Booking: {activeBooking?.bookingId || activeBooking?._id}
            </Text>

            <TouchableOpacity
              style={styles.goBtn}
              onPress={() =>
                navigation.navigate("ActiveJob", {
                  booking: activeBooking
                })
              }
            >
              <Text style={styles.goText}>CONTINUE JOB</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.waitCard}>
            <Ionicons name="time-outline" size={40} color="#999" />

            <Text style={styles.waitText}>
              {isOnline
                ? "Waiting for bookings..."
                : "Go Online to receive jobs"}
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.logout} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="red" />
          <Text style={{ color: "red", marginLeft: 5 }}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={!!incomingRequest} transparent animationType="fade">
        <View style={styles.modal}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Booking Request</Text>

            <Text style={styles.modalText}>
              📍 {incomingRequest?.address}
            </Text>

            <Text style={styles.modalText}>
              🚗 {incomingRequest?.distance} km away
            </Text>

            <Text style={styles.modalText}>
              📦 Booking: {incomingRequest?.bookingId}
            </Text>

            {!incomingRequest?.pickupLocation && (
              <Text style={{ color: "red", marginTop: 8 }}>
                ⚠️ Customer location missing
              </Text>
            )}

            <View style={{ flexDirection: "row", marginTop: 15 }}>
              <TouchableOpacity
                style={[styles.acceptBtn, { flex: 1 }]}
                onPress={handleAccept}
              >
                <Text style={styles.acceptText}>ACCEPT</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.rejectBtn, { flex: 1, marginLeft: 10 }]}
                onPress={handleReject}
              >
                <Text style={styles.rejectText}>REJECT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

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
    color: "#555",
    marginTop: 4
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
  },

  rejectBtn: {
    marginTop: 15,
    backgroundColor: "#FF3B30",
    padding: 12,
    borderRadius: 10
  },

  rejectText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold"
  }
});