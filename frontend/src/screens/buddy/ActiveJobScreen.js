import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import api from "../../api/Apiclient"; // Note: Try without .js first in React Native

export default function ActiveJobScreen({ route, navigation }) {
  // Destructure booking passed from BuddyHome handleAccept
  const { booking } = route.params;
  const [currentStatus, setCurrentStatus] = useState(booking?.status || 'accepted');
  const [loading, setLoading] = useState(false);

  /**
   * Status Workflow Manager
   * Transitions: accepted -> arrived -> started -> completed
   */
  const handleStatusUpdate = async (endpoint, nextStatus) => {
    try {
      setLoading(true);
      const res = await api.post(`/booking/${endpoint}`, { bookingId: booking._id });

      if (res.data.success) {
        if (endpoint === 'complete') {
          Alert.alert("Job Finished", "Earnings have been added to your wallet.");
          // Use replace so they can't go 'back' to an active job
          navigation.replace("BuddyHome");
        } else {
          setCurrentStatus(nextStatus);
        }
      }
    } catch (err) {
      Alert.alert("Update Failed", err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Client Info Header */}
      <View style={styles.card}>
        <Text style={styles.label}>ONGOING MISSION FOR</Text>
        <Text style={styles.clientName}>{booking?.user?.name || "Customer"}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusLabel}>{currentStatus.toUpperCase()}</Text>
        </View>
      </View>

      {/* 2. Instruction Card */}
      <View style={styles.instructionCard}>
        <Ionicons name="information-circle" size={24} color="#007AFF" />
        <Text style={styles.instructionText}>
          {currentStatus === 'accepted' && "Navigate to the customer location and click Arrived."}
          {currentStatus === 'arrived' && "Confirm with the customer before starting the work."}
          {currentStatus === 'started' && "Perform the service professionally. Click Finish once done."}
        </Text>
      </View>

      {/* 3. Action Button (The "Footer") */}
      <View style={styles.footer}>
        {currentStatus === 'accepted' && (
          <TouchableOpacity 
            disabled={loading}
            style={styles.actionBtn} 
            onPress={() => handleStatusUpdate('arrived', 'arrived')}
          >
            <Text style={styles.btnText}>{loading ? "Updating..." : "I HAVE ARRIVED"}</Text>
          </TouchableOpacity>
        )}

        {currentStatus === 'arrived' && (
          <TouchableOpacity 
            disabled={loading}
            style={[styles.actionBtn, { backgroundColor: '#5856D6' }]} 
            onPress={() => handleStatusUpdate('start', 'started')}
          >
            <Text style={styles.btnText}>START SERVICE</Text>
          </TouchableOpacity>
        )}

        {currentStatus === 'started' && (
          <TouchableOpacity 
            disabled={loading}
            style={[styles.actionBtn, { backgroundColor: '#34C759' }]} 
            onPress={() => handleStatusUpdate('complete', 'completed')}
          >
            <Text style={styles.btnText}>FINISH & COLLECT PAYMENT</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7', padding: 20 },
  card: { backgroundColor: '#FFF', padding: 25, borderRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  label: { fontSize: 12, color: '#8E8E93', fontWeight: 'bold', letterSpacing: 1 },
  clientName: { fontSize: 28, fontWeight: '800', marginVertical: 10 },
  statusBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 12 },
  statusLabel: { color: '#2E7D32', fontWeight: 'bold', fontSize: 12 },
  instructionCard: { flexDirection: 'row', backgroundColor: '#EBF5FF', padding: 20, borderRadius: 20, marginTop: 30, alignItems: 'center' },
  instructionText: { flex: 1, marginLeft: 15, color: '#004A99', fontSize: 14, lineHeight: 20 },
  footer: { position: 'absolute', bottom: 50, left: 20, right: 20 },
  actionBtn: { backgroundColor: '#000', paddingVertical: 20, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});