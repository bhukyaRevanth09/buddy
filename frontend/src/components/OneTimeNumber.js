import { View, TextInput, StyleSheet } from "react-native";
import { useRef, useState } from "react";

export default function OneTimeNumber({ length = 6, onChange }) {
  const [otp, setOtp] = useState(Array(length).fill(""));
  const inputs = useRef([]);

  const handleChange = (text, index) => {
    if (text.length > 1) return;

    // ✅ SAFE fallback
    const currentOtp = otp || Array(length).fill("");

    const newOtp = [...currentOtp];
    newOtp[index] = text;

    setOtp(newOtp);


    // ✅ SAFE join
    onChange(newOtp.join(""));

    if (text && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {Array(length)
        .fill("")
        .map((_, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputs.current[index] = ref)}
            style={styles.input}
            keyboardType="number-pad"
            maxLength={1}
            value={otp[index] || ""}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleBackspace(e, index)}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  input: {
    width: 45,
    height: 50,
    borderWidth: 1,
    textAlign: "center",
    fontSize: 18,
    borderRadius: 8,
  },
});