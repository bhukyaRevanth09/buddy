import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useState } from "react";
import OneTimeNumber from "../../components/OneTimeNumber.js";

export default function OTPScreen({ navigation }) {

  const [otp, setOtp] = useState("");

console.log("OTP STATE:", otp);
  const handleVerify = () => {
    console.log("Entered OTP:", otp);

  
    navigation.navigate("Home");
  };

  return (
    <View style={styles.container}>
      
      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.subtitle}>
        We sent a code to your phone
      </Text>

      <OneTimeNumber length={6} onChange={setOtp} />

      <TouchableOpacity style={styles.button} onPress={handleVerify}>
        <Text style={styles.buttonText}>Verify OTP</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold" },
  subtitle: { marginVertical: 10 },
  button: {
    backgroundColor: "black",
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: { color: "white", textAlign: "center" },
});