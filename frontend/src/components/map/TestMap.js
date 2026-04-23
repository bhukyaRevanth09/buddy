import React from "react";
import MapView from "react-native-maps";
import { View } from "react-native";

export default function TestMap(){
    console.log("revanth")
return(
<View style={{flex:1}}>
<MapView
style={{flex:1}}
initialRegion={{
latitude:17.385,
longitude:78.486,
latitudeDelta:0.05,
longitudeDelta:0.05
}}
/>
</View>
);
}