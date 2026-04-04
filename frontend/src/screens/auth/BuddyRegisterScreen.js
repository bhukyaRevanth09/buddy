import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useState, useEffect } from "react";
import axios from "axios";
import * as Location from "expo-location";

const CATEGORIES = [
  "Moving Help",
  "Event Help",
  "Companion",
  "Sports Activity",
  "Daily Help",
  "Pet Care",
];

const SKILLS_BY_CATEGORY = {
  "Moving Help": ["Lifting", "Packing", "Furniture Arrangement", "Box Labeling"],
  "Event Help": ["Birthday Decoration", "Table Setup", "Setup Help", "Clean Up"],
  Companion: ["Talking", "Movies", "Travel", "Shopping Companion"],
  "Sports Activity": ["Cricket Partner", "Football Partner", "Running Partner", "Yoga Partner"],
  "Daily Help": ["Shopping Help", "Errands", "Cooking Help", "Cleaning Help"],
  "Pet Care": ["Dog Walking", "Pet Sitting", "Feeding Pets", "Grooming Assistance"],
};

const INTERESTS = [
  "Gym","Running","Travel","Movies","Music","Cooking",
  "Hiking","Cycling","Photography","Reading","Yoga",
  "Dancing","Gaming","Pet Care","Painting","Shopping",
];

const GENDERS = ["Male", "Female", "Other"];

export default function BuddyRegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    gender: "",
    category: "",
    skills: [],
    interests: [],
    education: "",
    pricePerHour: "",
    location: { latitude: null, longitude: null, address: "" },
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 📍 Get Location
  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Location permission denied");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const reverse = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      const place = reverse[0];

      setForm((prev) => ({
        ...prev,
        location: {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          address: `${place.city || ""}, ${place.region || ""}`,
        },
      }));
    } catch (err) {
      alert("Location error");
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  const isValid =
    form.name &&
    /^[6-9]\d{9}$/.test(form.phone) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.password.length >= 6 &&
    form.gender &&
    form.category &&
    form.skills.length > 0 &&
    form.interests.length > 0 &&
    form.pricePerHour &&
    form.location.latitude;

  const toggleItem = (key, value) => {
    const current = form[key];

    if (current.includes(value)) {
      setForm({ ...form, [key]: current.filter((i) => i !== value) });
    } else {
      if (key === "skills" && current.length >= 2) return alert("Max 2 skills");
      if (key === "interests" && current.length >= 6) return alert("Max 6 interests");

      setForm({ ...form, [key]: [...current, value] });
    }
  };

  // 🔥 REGISTER → SEND OTP ONLY
  const handleRegister = async () => {
    if (!isValid) {
      alert("Fill all fields correctly");
      return;
    }

    try {
      setLoading(true);

      // ✅ SEND OTP FIRST
      const res = await axios.post(
        "http://10.0.0.19:9090/api/auth/send-otp",
        { phone: form.phone,email:form.email,role:"buddy",type:"register" }
      );

      if (res.data.success) {
        navigation.navigate("OTP", {
          role: "buddy",
          type: "register",
          phone: form.phone,
          formData: form, // 🔥 send full data
        });
      } else {
        alert("OTP failed");
      }

    } catch (err) {
      console.log(err);
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Become a Buddy</Text>

      <TextInput placeholder="Name" style={styles.input}
        onChangeText={(v) => setForm({ ...form, name: v })} />

      <TextInput placeholder="Email" style={styles.input}
        onChangeText={(v) => setForm({ ...form, email: v })} />

  <TextInput
  placeholder="Phone" style={styles.input} keyboardType="phone-pad" maxLength={10}             
  onChangeText={(v) => setForm({ ...form, phone: v })}
/>

      <TouchableOpacity style={styles.input} onPress={getLocation}>
        <Text>{form.location.address || "Detect Location"}</Text>
      </TouchableOpacity>

      <View>
        <TextInput
          placeholder="Password"
          secureTextEntry={!showPassword}
          style={styles.input}
          onChangeText={(v) => setForm({ ...form, password: v })}
        />
        <TouchableOpacity style={styles.eye}
          onPress={() => setShowPassword(!showPassword)}>
          <Text>{showPassword ? "Hide" : "Show"}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Gender</Text>
      <View style={styles.row}>
        {GENDERS.map((g) => (
          <TouchableOpacity key={g}
            style={[styles.chip, form.gender === g && styles.selectedChip]}
            onPress={() => setForm({ ...form, gender: g })}>
            <Text>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Category</Text>
      <View style={styles.row}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity key={c}
            style={[styles.chip, form.category === c && styles.selectedChip]}
            onPress={() => setForm({ ...form, category: c, skills: [] })}>
            <Text>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {form.category && (
        <>
          <Text style={styles.label}>Skills</Text>
          <View style={styles.row}>
            {SKILLS_BY_CATEGORY[form.category].map((s) => (
              <TouchableOpacity key={s}
                style={[styles.chip, form.skills.includes(s) && styles.selectedChip]}
                onPress={() => toggleItem("skills", s)}>
                <Text>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={styles.label}>Interests</Text>
      <View style={styles.row}>
        {INTERESTS.map((i) => (
          <TouchableOpacity key={i}
            style={[styles.chip, form.interests.includes(i) && styles.selectedChip]}
            onPress={() => toggleItem("interests", i)}>
            <Text>{i}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput placeholder="Education (Optional)" style={styles.input}
        onChangeText={(v) => setForm({ ...form, education: v })} />

      <TextInput placeholder="Price ₹" style={styles.input}
        onChangeText={(v) => setForm({ ...form, pricePerHour: v })} />

      <TouchableOpacity
        style={[styles.button, (!isValid || loading) && { opacity: 0.5 }]}
        disabled={!isValid || loading}
        onPress={handleRegister}
      >
        <Text style={styles.buttonText}>
          {loading ? "Sending OTP..." : "Register"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginTop: 30, marginBottom: 20 },
  input: { borderWidth: 1, padding: 12, borderRadius: 10, marginBottom: 15 },
  label: { fontWeight: "bold", marginBottom: 10 },
  row: { flexDirection: "row", flexWrap: "wrap" },
  chip: { borderWidth: 1, padding: 10, borderRadius: 20, margin: 5 },
  selectedChip: { backgroundColor: "#cce5ff" },
  button: { backgroundColor: "black", padding: 15, borderRadius: 10,marginBottom:20 },
  buttonText: { color: "white", textAlign: "center", fontWeight: "bold" },
  eye: { position: "absolute", right: 15, top: 15 },
});