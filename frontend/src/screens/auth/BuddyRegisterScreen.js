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

const BASE_URL = "http://10.112.58.157:9090/api";

const GENDERS = ["Male", "Female", "Other"];

export default function BuddyRegisterScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [interests, setInterests] = useState([]);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
    location: {
      latitude: null,
      longitude: null,
      address: "",
      street: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  // LOCATION
  const getLocation = async () => {
    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({});

      const reverse =
        await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

      const place = reverse[0];

      const address = `${place.name || ""}, ${
        place.street || ""
      }, ${place.city || ""}, ${place.region || ""}, ${
        place.postalCode || ""
      }`;

      setForm((prev) => ({
        ...prev,
        location: {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          address,
          street: place.street,
          city: place.city,
          state: place.region,
          pincode: place.postalCode,
        },
      }));
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getLocation();
    fetchCategories();
    fetchInterests();
  }, []);

  const fetchCategories = async () => {
    const res = await axios.get(`${BASE_URL}/user/categories`);
    setCategories(res.data.data);
  };

  const fetchInterests = async () => {
    const res = await axios.get(`${BASE_URL}/user/interests`);
    setInterests(res.data.data);
  };

  const handleCategory = async (category) => {
    setForm({
      ...form,
      category: category._id,
      skills: [],
    });

    const res = await axios.get(
      `${BASE_URL}/user/skills/${category._id}`
    );

    setSkills(res.data.data);
  };

  
  const toggleItem = (key, value) => {
    const current = form[key];

    if (current.includes(value)) {
      setForm({
        ...form,
        [key]: current.filter((i) => i !== value),
      });
    } else {
      if (key === "interests" && current.length >= 6)
        return alert("Max 6 interests");

      setForm({
        ...form,
        [key]: [...current, value],
      });
    }
  };

  // UPDATED VALIDATION
  const validate = () => {
    if (!form.name) return "Name required";
    if (!form.email) return "Email required";
    if (!form.phone) return "Phone required";

    if (!/^[6-9]\d{9}$/.test(form.phone))
      return "Invalid phone number";

    if (!form.password || form.password.length < 6)
      return "Password min 6 char";

    if (!form.gender) return "Select gender";
    if (!form.category) return "Select category";

    if (form.skills.length < 1)
      return "Select at least 1 skill";

    if (form.interests.length === 0)
      return "Select interests";

    if (!form.location.latitude)
      return "Location required";

    return null;
  };

  // REGISTER
  const handleRegister = async () => {
    const error = validate();
    if (error) {
      alert(error);
      return;
    }

    try {
      setLoading(true);

      const finalFormData = {
        ...form,
        geoLocation: {
          type: "Point",
          coordinates: [
            parseFloat(form.location.longitude),
            parseFloat(form.location.latitude),
          ],
        },
      };

      const res = await axios.post(`${BASE_URL}/auth/send-otp`, {
        email: form.email,
        role: "buddy",
        type: "register",
      });

      if (res.data.success) {
        navigation.navigate("OTP", {
          role: "buddy",
          type: "register",
          email: form.email,
          formData: finalFormData,
        });
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Become a Buddy</Text>

      <TextInput
        placeholder="Name"
        style={styles.input}
        onChangeText={(v) => setForm({ ...form, name: v })}
      />

      <TextInput
        placeholder="Email"
        style={styles.input}
        onChangeText={(v) => setForm({ ...form, email: v })}
      />

      <TextInput
        placeholder="Phone"
        style={styles.input}
        keyboardType="phone-pad"
        maxLength={10}
        onChangeText={(v) => setForm({ ...form, phone: v })}
      />

      <TouchableOpacity style={styles.input} onPress={getLocation}>
        <Text>{form.location.address || "Detect Location"}</Text>
      </TouchableOpacity>

      {/* PASSWORD */}
      <View style={{ position: "relative" }}>
        <TextInput
          placeholder="Password"
          secureTextEntry={!showPassword}
          style={styles.input}
          onChangeText={(v) =>
            setForm({ ...form, password: v })
          }
        />
        <TouchableOpacity
          style={styles.eye}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Text>{showPassword ? "Hide" : "Show"}</Text>
        </TouchableOpacity>
      </View>

      {/* GENDER */}
      <Text style={styles.label}>Gender</Text>
      <View style={styles.row}>
        {GENDERS.map((g) => (
          <TouchableOpacity
            key={g}
            style={[
              styles.chip,
              form.gender === g && styles.selectedChip,
            ]}
            onPress={() => setForm({ ...form, gender: g })}
          >
            <Text>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CATEGORY */}
      <Text style={styles.label}>Select Category</Text>
      <View style={styles.row}>
        {categories.map((c) => (
          <TouchableOpacity
            key={c._id}
            style={[
              styles.chip,
              form.category === c._id && styles.selectedChip,
            ]}
            onPress={() => handleCategory(c)}
          >
            <Text>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SKILLS */}
      {form.category && (
        <>
          <Text style={styles.label}>
            Skills (select at least 1)
          </Text>
          <View style={styles.row}>
            {skills.map((s) => (
              <TouchableOpacity
                key={s._id}
                style={[
                  styles.chip,
                  form.skills.includes(s._id) &&
                    styles.selectedChip,
                ]}
                onPress={() =>
                  toggleItem("skills", s._id)
                }
              >
                <Text>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* INTERESTS */}
      {form.category && (
        <>
          <Text style={styles.label}>Interests</Text>
          <View style={styles.row}>
            {interests.map((i) => (
              <TouchableOpacity
                key={i._id}
                style={[
                  styles.chip,
                  form.interests.includes(i._id) &&
                    styles.selectedChip,
                ]}
                onPress={() =>
                  toggleItem("interests", i._id)
                }
              >
                <Text>{i.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <TextInput
        placeholder="Education (optional)"
        style={styles.input}
        onChangeText={(v) =>
          setForm({ ...form, education: v })
        }
      />

      <TouchableOpacity
        style={styles.button}
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 30,
  },
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginVertical: 8,
  },
  label: {
    fontWeight: "bold",
    marginTop: 10,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    borderWidth: 1,
    padding: 8,
    borderRadius: 20,
    margin: 5,
  },
  selectedChip: {
    backgroundColor: "#cce5ff",
  },
  button: {
    backgroundColor: "black",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 40,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
  },
  eye: {
    position: "absolute",
    right: 15,
    top: 20,
  },
});