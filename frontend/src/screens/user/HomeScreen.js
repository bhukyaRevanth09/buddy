import React, { useEffect, useState, useContext, useRef } from "react";
import {
View,
Text,
TouchableOpacity,
StyleSheet,
ScrollView,
ActivityIndicator,
Dimensions
} from "react-native";

import MapView, { Marker } from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";

import api from "../../api/Apiclient";
import { SocketContext } from "../../context/socketContext.js";
import { LocationContext } from "../../context/LocationContext";

const { height } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {

const mapRef = useRef(null);
const { socket } = useContext(SocketContext);

const {
currentLocation: userLocation,
selectedLocation
} = useContext(LocationContext);

const [locationName, setLocationName] = useState("");

const [categories, setCategories] = useState([]);
const [availableSkills, setAvailableSkills] = useState([]);
const [availableInterests, setAvailableInterests] = useState([]);

const [selectedCategory, setSelectedCategory] = useState(null);
const [selectedSkills, setSelectedSkills] = useState([]);
const [selectedInterests, setSelectedInterests] = useState([]);

const [loading, setLoading] = useState(true);
const [bookingLoading,setBookingLoading] = useState(false);


/*
===========================
GET FULL ADDRESS
===========================
*/
useEffect(() => {

const loc = selectedLocation || userLocation;
if (!loc) return;

(async () => {

try {

const res = await Location.reverseGeocodeAsync(loc);

if (res.length > 0) {

const place = res[0];

const fullAddress = [
place.name,
place.streetNumber,
place.street,
place.district,
place.subregion,
place.city,
place.region,
place.postalCode
]
.filter(Boolean)
.join(", ");

setLocationName(fullAddress);

}

} catch (e) {
console.log("Reverse geocode error", e);
}

})();

}, [selectedLocation, userLocation]);


/*
===========================
LOAD INITIAL DATA
===========================
*/
useEffect(() => {

(async () => {

try {

const [catRes, intRes] = await Promise.all([
api.get("/user/categories"),
api.get("/user/interests")
]);

setCategories(catRes.data.data || []);
setAvailableInterests(intRes.data.data || []);

} catch (err) {
console.log("Init Data Error:", err);
}

setLoading(false);

})();

}, []);


/*
===========================
MAP ANIMATE
===========================
*/
useEffect(() => {

if (selectedLocation) {

mapRef.current?.animateToRegion(
{
...selectedLocation,
latitudeDelta: 0.05,
longitudeDelta: 0.05
},
800
);

}

}, [selectedLocation]);


useEffect(() => {

if (!selectedLocation && userLocation) {

mapRef.current?.animateToRegion(
{
...userLocation,
latitudeDelta:0.05,
longitudeDelta:0.05
},
800
);

}

}, [userLocation]);


/*
===========================
LOAD SKILLS
===========================
*/
useEffect(() => {

if (!selectedCategory?._id) {
setAvailableSkills([]);
setSelectedSkills([]);
return;
}

api
.get(`/user/skills/${selectedCategory._id}`)
.then(res => setAvailableSkills(res.data.data || []));

}, [selectedCategory]);


/*
===========================
HELPERS
===========================
*/
const toggleSelection = (id, list, setList) => {

if (list.includes(id)) {
setList(list.filter(i => i !== id));
} else {
setList([...list, id]);
}

};

const recenterMap = () => {

if (userLocation) {

mapRef.current?.animateToRegion(
{
...userLocation,
latitudeDelta:0.05,
longitudeDelta:0.05
},
800
);

}

};

const isFindDisabled =
!selectedCategory || selectedSkills.length === 0;


/*
===========================
BOOKING
===========================
*/
const handleFindBuddy = async () => {

if (isFindDisabled) return;

const locationToUse =
selectedLocation || userLocation;

try {

setBookingLoading(true);

const res = await api.post(
"/booking/request",
{
category: selectedCategory?._id,
skills: selectedSkills,
interests: selectedInterests,
lat: locationToUse.latitude,
lng: locationToUse.longitude,
price: 0
}
);

/*
NO BUDDIES
*/
if (!res.data.success) {
alert(res.data.message || "No buddies available");
setBookingLoading(false);
return;
}

/*
NAVIGATE AFTER API
*/
navigation.navigate("Matching", {
bookingId: res.data.bookingId,
location: locationToUse
});

} catch (err) {

console.log("Booking error:", err);
alert("No buddies available");

}

setBookingLoading(false);

};


if (loading || !userLocation) {

return (
<View style={styles.center}>
<ActivityIndicator size="large" color="#4CAF50" />
</View>
);

}


return (

<SafeAreaView style={styles.container}>

{/* MAP */}
<MapView
ref={mapRef}
style={styles.map}
showsUserLocation
initialRegion={{
latitude:
selectedLocation?.latitude ||
userLocation.latitude,
longitude:
selectedLocation?.longitude ||
userLocation.longitude,
latitudeDelta:0.05,
longitudeDelta:0.05
}}
>

{selectedLocation && (
<Marker
coordinate={selectedLocation}
pinColor="red"
/>
)}

</MapView>


{/* LOCATION BUTTON */}
<TouchableOpacity
style={styles.selectLocationBtn}
onPress={() =>
navigation.navigate("SelectLocation")
}
>

<MaterialIcons
name="location-on"
size={20}
color="#4CAF50"
/>

<View style={{ marginLeft: 10 }}>

<Text style={styles.selectLabel}>
{selectedLocation
? "Selected Location"
: "Current Location"}
</Text>

<Text
style={styles.selectText}
numberOfLines={2}
>
{locationName || "Loading address..."}
</Text>

</View>
</TouchableOpacity>


{/* RECENTER */}
<TouchableOpacity
style={styles.recenterBtn}
onPress={recenterMap}
>
<MaterialIcons
name="my-location"
size={24}
color="#007AFF"
/>
</TouchableOpacity>


{/* FILTER PANEL */}
<View style={styles.panel}>
<ScrollView>

<Text style={styles.label}>Category</Text>

<ScrollView horizontal>
{categories.map(c => (
<TouchableOpacity
key={c._id}
onPress={() =>
setSelectedCategory(c)
}
style={[
styles.chip,
selectedCategory?._id === c._id &&
styles.activeChip
]}
>
<Text
style={{
color:
selectedCategory?._id === c._id
? "#fff"
: "#333"
}}
>
{c.name}
</Text>
</TouchableOpacity>
))}
</ScrollView>


<Text style={styles.label}>Skills</Text>

<ScrollView horizontal>
{availableSkills.map(s => (
<TouchableOpacity
key={s._id}
onPress={() =>
toggleSelection(
s._id,
selectedSkills,
setSelectedSkills
)
}
style={[
styles.chip,
selectedSkills.includes(s._id) &&
styles.activeChip
]}
>
<Text
style={{
color:
selectedSkills.includes(s._id)
? "#fff"
: "#333"
}}
>
{s.name}
</Text>
</TouchableOpacity>
))}
</ScrollView>


<Text style={styles.label}>
Interests (optional)
</Text>

<ScrollView horizontal>
{availableInterests.map(i => (
<TouchableOpacity
key={i._id}
onPress={() =>
toggleSelection(
i._id,
selectedInterests,
setSelectedInterests
)
}
style={[
styles.chip,
selectedInterests.includes(i._id) &&
styles.activeChip
]}
>
<Text
style={{
color:
selectedInterests.includes(i._id)
? "#fff"
: "#333"
}}
>
{i.name}
</Text>
</TouchableOpacity>
))}
</ScrollView>


<TouchableOpacity
disabled={
isFindDisabled || bookingLoading
}
style={[
styles.findBtn,
(isFindDisabled || bookingLoading)
&& styles.disabledBtn
]}
onPress={handleFindBuddy}
>

{bookingLoading ? (
<ActivityIndicator color="#fff"/>
) : (
<Text
style={{
color:"#fff",
fontWeight:"700"
}}
>
Confirm Booking
</Text>
)}

</TouchableOpacity>

</ScrollView>
</View>

</SafeAreaView>
);
}


const styles = StyleSheet.create({

container:{flex:1,backgroundColor:"#fff"},
map:{flex:1},

selectLocationBtn:{
position:"absolute",
top:50,
left:20,
right:20,
backgroundColor:"#fff",
flexDirection:"row",
padding:14,
borderRadius:15,
elevation:5,
alignItems:"center"
},

selectLabel:{
fontSize:11,
color:"#999"
},

selectText:{
fontSize:13,
fontWeight:"600",
color:"#000",
width:260,
lineHeight:18
},

recenterBtn:{
position:"absolute",
bottom:height*0.46,
right:20,
backgroundColor:"#fff",
padding:12,
borderRadius:30,
elevation:5
},

panel:{
position:"absolute",
bottom:90,
left:10,
right:10,
backgroundColor:"#fff",
padding:15,
borderRadius:25,
maxHeight:height*0.38,
elevation:20
},

label:{
fontWeight:"700",
marginTop:12,
marginBottom:5
},

chip:{
paddingHorizontal:15,
paddingVertical:8,
backgroundColor:"#f0f0f0",
borderRadius:20,
margin:5
},

activeChip:{
backgroundColor:"#4CAF50"
},

findBtn:{
backgroundColor:"#000",
padding:16,
borderRadius:15,
marginTop:20,
alignItems:"center"
},

disabledBtn:{
backgroundColor:"#ccc"
},

center:{
flex:1,
justifyContent:"center",
alignItems:"center"
}

});