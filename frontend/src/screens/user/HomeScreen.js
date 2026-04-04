import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
} from "react-native";

const CATEGORIES = [
  { id: "1", name: "Moving", icon: "🚚" },
  { id: "2", name: "Event", icon: "🎉" },
  { id: "3", name: "Sports", icon: "⚽" },
  { id: "4", name: "Companion", icon: "🤝" },
];

const BUDDIES = [
  {
    id: "1",
    name: "Ravi",
    rating: 4.8,
    skill: "Moving Expert",
    price: 150,
    image: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: "2",
    name: "Arjun",
    rating: 4.6,
    skill: "Event Setup",
    price: 120,
    image: "https://i.pravatar.cc/150?img=2",
  },
];

const HomeScreen = () => {
  const renderCategory = ({ item }) => (
    <TouchableOpacity style={styles.categoryCard}>
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text style={styles.categoryText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderBuddy = ({ item }) => (
    <View style={styles.buddyCard}>
      <Image source={{ uri: item.image }} style={styles.buddyImage} />

      <View style={{ flex: 1 }}>
        <Text style={styles.buddyName}>{item.name}</Text>
        <Text style={styles.buddySkill}>{item.skill}</Text>
        <Text style={styles.buddyRating}>⭐ {item.rating}</Text>
      </View>

      <View style={{ alignItems: "flex-end" }}>
        <Text style={styles.price}>₹{item.price}/hr</Text>
        <TouchableOpacity style={styles.bookBtn}>
          <Text style={styles.bookText}>Book</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 🔍 CLEAN SEARCH BAR */}
      <View style={styles.searchWrapper}>
        <TextInput
          placeholder="Search for help..."
          placeholderTextColor="#888"
          style={styles.search}
        />
      </View>

      {/* 🧩 MEDIUM SIZE CATEGORIES */}
      <FlatList
        data={CATEGORIES}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 10 }}
      />

      {/* ⭐ Recommended */}
      <Text style={styles.sectionTitle}>Recommended</Text>
      <FlatList
        data={BUDDIES}
        renderItem={renderBuddy}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f7fb",
    padding: 15,
  },

  /* 🔍 SEARCH BAR FIXED */
  searchWrapper: {
    marginTop:40,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },

  search: {
    fontSize: 15,
  },

  /* 🧩 MEDIUM CATEGORY CARDS */
  categoryCard: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderRadius: 12,
    marginRight: 10,
    alignItems: "center",
    width: 100, // 👈 medium size
    elevation: 0,
    height:100
  },

  categoryIcon: {
    fontSize: 22,
  },

  categoryText: {
    marginTop: 5,
    fontSize: 13,
    fontWeight: "500",
  },

  /* ⭐ Section */
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 10,
  },

  /* 👤 Buddy Card */
  buddyCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
  },

  buddyImage: {
    width: 55,
    height: 55,
    borderRadius: 30,
    marginRight: 10,
  },

  buddyName: {
    fontWeight: "bold",
    fontSize: 15,
  },

  buddySkill: {
    color: "gray",
    fontSize: 12,
  },

  buddyRating: {
    fontSize: 12,
    color: "#f39c12",
  },

  price: {
    fontWeight: "bold",
    fontSize: 13,
    marginBottom: 5,
  },

  bookBtn: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },

  bookText: {
    color: "#fff",
    fontSize: 12,
  },
});