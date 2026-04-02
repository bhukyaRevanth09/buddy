import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useState } from "react";

const CATEGORIES = [
  "Moving Help",
  "Event Help",
  "Companion",
  "Sports Activity",
  "Daily Help",
];

const SKILLS_BY_CATEGORY = {
  "Moving Help": ["Lifting", "Packing"],
  "Event Help": ["Birthday Decoration", "Table Setup", "Setup Help"],
  Companion: ["Talking", "Movies", "Travel"],
  "Sports Activity": ["Cricket Partner", "Football Partner", "Running Partner"],
  "Daily Help": ["Shopping Help", "Errands"],
};

const INTERESTS = [
  "Gym",
  "Running",
  "Talking",
  "Friendly",
  "Travel",
  "Movies",
  "Cricket",
  "Football",
];

export default function BuddyRegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    category: "",
    skills: [],
    interests: [],
    education: "",
    pricePerHour: "",
  });

  const toggleItem = (key, value) => {
    const current = form[key];
    if (current.includes(value)) {
      setForm({
        ...form,
        [key]: current.filter((item) => item !== value),
      });
    } else {
      setForm({
        ...form,
        [key]: [...current, value],
      });
    }
  };

  const handleRegister = () => {
    if (!form.name || !form.phone || !form.password || !form.category) {
      alert("Please fill all required fields");
      return;
    }
    console.log("BUDDY DATA:", form);
    // 👉 Send this data to backend API
    navigation.navigate("BuddyHome");
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Become a Buddy 🤝</Text>

      {/* Name */}
      <TextInput
        placeholder="Your Name"
        style={styles.input}
        onChangeText={(v) => setForm({ ...form, name: v })}
      />

      {/* Phone */}
      <TextInput
        placeholder="Phone Number"
        keyboardType="phone-pad"
        style={styles.input}
        onChangeText={(v) => setForm({ ...form, phone: v })}
      />

      {/* Password */}
      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        onChangeText={(v) => setForm({ ...form, password: v })}
      />

      {/* Category */}
      <Text style={styles.label}>Select Category</Text>
      <View style={styles.row}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.chip,
              form.category === cat && styles.selectedChip,
            ]}
            onPress={() =>
              setForm({ ...form, category: cat, skills: [] })
            }
          >
            <Text>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Skills */}
      {form.category ? (
        <>
          <Text style={styles.label}>Select Skills</Text>
          <View style={styles.row}>
            {SKILLS_BY_CATEGORY[form.category].map((skill) => (
              <TouchableOpacity
                key={skill}
                style={[
                  styles.chip,
                  form.skills.includes(skill) && styles.selectedChip,
                ]}
                onPress={() => toggleItem("skills", skill)}
              >
                <Text>{skill}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : null}

      {/* Interests */}
      <Text style={styles.label}>About You / Interests</Text>
      <View style={styles.row}>
        {INTERESTS.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.chip,
              form.interests.includes(item) && styles.selectedChip,
            ]}
            onPress={() => toggleItem("interests", item)}
          >
            <Text>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Education */}
      <TextInput
        placeholder="Education (optional)"
        style={styles.input}
        onChangeText={(v) => setForm({ ...form, education: v })}
      />

      {/* Price */}
      <TextInput
        placeholder="Price per hour (₹)"
        keyboardType="numeric"
        style={styles.input}
        onChangeText={(v) => setForm({ ...form, pricePerHour: v })}
      />

      {/* Register */}
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      {/* Login */}
      <Text
        style={styles.link}
        onPress={() => navigation.navigate("BuddyLogin")}
      >
        Already a buddy? Login
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, marginTop: 30 },
  input: { borderWidth: 1, borderColor: "#ddd", padding: 12, borderRadius: 10, marginBottom: 15 },
  label: { fontWeight: "bold", marginBottom: 10 },
  row: { flexDirection: "row", flexWrap: "wrap", marginBottom: 15 },
  chip: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  selectedChip: { backgroundColor: "#cce5ff", borderColor: "#007bff" },
  button: { backgroundColor: "black", padding: 15, borderRadius: 10, marginTop: 10 },
  buttonText: { color: "white", textAlign: "center", fontWeight: "bold" },
  link: { marginTop: 15, textAlign: "center", color: "blue" },
});