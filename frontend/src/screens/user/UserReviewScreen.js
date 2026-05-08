import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";

import api from "../../api/Apiclient.js";

export default function UserReviewScreen({ route, navigation }) {
  const { bookingId, buddy } = route.params || {};

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const goHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "MainTabs" }]
    });
  };

  const submitReview = async () => {
    if (!bookingId) {
      Alert.alert("Error", "Booking ID missing");
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      Alert.alert("Error", "Please select rating");
      return;
    }

    try {
      setLoading(true);

    

      const res = await api.post("/reviews", {
        bookingId,
        rating,
        comment
      });

      console.log(" REVIEW API RESPONSE:", res.data);

      if (res?.data?.success) {
        Alert.alert("Thank you", "Review submitted successfully", [
          {
            text: "OK",
            onPress: goHome
          }
        ]);
      } else {
        Alert.alert(
          "Error",
          res?.data?.message || "Review failed"
        );
      }

    } catch (err) {
      console.log(" REVIEW API ERROR:", err);
      console.log(" REVIEW ERROR RESPONSE:", err?.response);
      console.log(" REVIEW ERROR DATA:", err?.response?.data);
      console.log(" REVIEW ERROR MESSAGE:", err?.message);

      Alert.alert(
        "Error",
        err?.response?.data?.message || "Review failed"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Rate your Buddy</Text>

          <Text style={styles.subtitle}>
            How was your experience?
          </Text>

          <Text style={styles.name}>
            {buddy?.name || "Buddy"}
          </Text>

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((num) => (
              <TouchableOpacity
                key={num}
                onPress={() => setRating(num)}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.star}>
                  {num <= rating ? "⭐" : "☆"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.ratingText}>
            {rating} / 5
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Write feedback (optional)"
            placeholderTextColor="#999"
            value={comment}
            onChangeText={setComment}
            multiline
            editable={!loading}
          />

          <TouchableOpacity
            style={[
              styles.btn,
              loading && styles.disabledBtn
            ]}
            onPress={submitReview}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>
                Submit Review
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goHome}
            disabled={loading}
          >
            <Text style={styles.skip}>Skip</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    backgroundColor: "#F7F8FA"
  },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4
  },

  title: {
    fontSize: 25,
    fontWeight: "800",
    textAlign: "center",
    color: "#111"
  },

  subtitle: {
    marginTop: 8,
    textAlign: "center",
    color: "#777",
    fontSize: 15
  },

  name: {
    textAlign: "center",
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#222"
  },

  stars: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25
  },

  star: {
    fontSize: 38,
    marginHorizontal: 4
  },

  ratingText: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 15,
    color: "#555",
    fontWeight: "700"
  },

  input: {
    marginTop: 25,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 14,
    padding: 14,
    height: 120,
    textAlignVertical: "top",
    fontSize: 15,
    color: "#111",
    backgroundColor: "#FAFAFA"
  },

  btn: {
    marginTop: 22,
    backgroundColor: "#000",
    padding: 16,
    borderRadius: 14,
    minHeight: 54,
    justifyContent: "center"
  },

  disabledBtn: {
    opacity: 0.7
  },

  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 16
  },

  skip: {
    marginTop: 16,
    textAlign: "center",
    color: "#777",
    fontWeight: "700"
  }
});