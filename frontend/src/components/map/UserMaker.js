import React from "react";
import { Marker } from "react-native-maps";
import { View, Text, StyleSheet } from "react-native";

export default function UserMarker({ location }) {

if (!location) return null;

return (
<Marker coordinate={location} title="You">
<View style={styles.marker}>
<Text style={styles.icon}>📍</Text>
</View>
</Marker>
);
}

const styles = StyleSheet.create({
marker:{
backgroundColor:"#34C759",
padding:6,
borderRadius:20
},
icon:{
color:"#fff"
}
});