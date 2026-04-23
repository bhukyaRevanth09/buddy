import React from "react";
import { Marker } from "react-native-maps";
import { View, Text, StyleSheet } from "react-native";

export default function BuddyMarker({ buddy }) {

if (!buddy?.location?.coordinates) return null;

return (
<Marker
coordinate={{
latitude: buddy.location.coordinates[1],
longitude: buddy.location.coordinates[0],
}}
title={buddy.name}
>

<View style={styles.marker}>
<Text style={styles.icon}>🧑</Text>
</View>

</Marker>
);
}

const styles = StyleSheet.create({
marker:{
backgroundColor:"#007AFF",
padding:6,
borderRadius:20
},
icon:{
color:"#fff"
}
});