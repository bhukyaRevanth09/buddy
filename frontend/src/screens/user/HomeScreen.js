import React, { useState, useEffect, useCallback, useContext } from "react";
import {
View, Text, TouchableOpacity, FlatList,
StyleSheet, Image, ScrollView, ActivityIndicator,
Alert, StatusBar
} from "react-native";

import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';

import MapView,{ PROVIDER_GOOGLE } from "react-native-maps";

import api from "../../api/Apiclient";
import { SocketContext } from "../../context/socketContext.js";

import UserMarker from "../../components/map/UserMaker.js";
import BuddyMarker from "../../components/map/BuddyMaker.js";

export default function HomeScreen({ navigation }) {

const { socket } = useContext(SocketContext);

const [buddies,setBuddies] = useState([]);
const [categories,setCategories] = useState([]);
const [availableSkills,setAvailableSkills] = useState([]);
const [availableInterests,setAvailableInterests] = useState([]);

const [selectedCategory,setSelectedCategory] = useState(null);
const [selectedSkills,setSelectedSkills] = useState([]);
const [selectedInterests,setSelectedInterests] = useState([]);

const [userLocation,setUserLocation] = useState(null);
const [loading,setLoading] = useState(true);
const [refreshing,setRefreshing] = useState(false);



/*
==============================
INIT
==============================
*/
useEffect(()=>{
const init = async()=>{
try{

let {status} =
await Location.requestForegroundPermissionsAsync();

if(status==="granted"){
const loc = await Location.getCurrentPositionAsync({});
setUserLocation(loc.coords);
}

const [catRes,intRes] = await Promise.all([
api.get("/user/categories"),
api.get("/user/interests")
]);

setCategories(catRes.data.data || []);
setAvailableInterests(intRes.data.data || []);

}catch(e){}

setLoading(false);
};

init();
},[]);



/*
==============================
LOAD SKILLS
==============================
*/
useEffect(()=>{

if(!selectedCategory?._id){
setAvailableSkills([]);
setSelectedSkills([]);
return;
}

api.get(`/user/skills/${selectedCategory._id}`)
.then(res=>{
setAvailableSkills(res.data.data || []);
})
.catch(()=>setAvailableSkills([]));

},[selectedCategory]);



/*
==============================
REALTIME STATUS
==============================
*/
useEffect(()=>{

if(!socket) return;

socket.on("buddy_status_updated",(data)=>{

if(!data.isOnline){
setBuddies(prev =>
prev.filter(b=>b._id!==data.buddyId)
);
}else{
fetchNearestBuddies();
}

});

return ()=>socket.off("buddy_status_updated");

},[socket]);



/*
==============================
FETCH BUDDIES
==============================
*/
const fetchNearestBuddies = useCallback(async()=>{

if(!userLocation) return;

setRefreshing(true);

try{

const res = await api.get(
"/user/nearest-buddy",
{
params:{
latitude:userLocation.latitude,
longitude:userLocation.longitude,
categoryId:selectedCategory?._id,
skillIds:selectedSkills.join(","),
interestIds:selectedInterests.join(",")
}
});

setBuddies(res.data.data || []);

}catch(e){}

setRefreshing(false);

},[
userLocation,
selectedCategory,
selectedSkills,
selectedInterests
]);

useEffect(()=>{
fetchNearestBuddies();
},[fetchNearestBuddies]);



/*
==============================
TOGGLE
==============================
*/
const toggleSelection=(id,list,setList)=>{

if(list.includes(id)){
setList(list.filter(i=>i!==id));
}else{
setList([...list,id]);
}

};



/*
==============================
MATCH
==============================
*/
const handleStartMatching = async()=>{

if(!selectedCategory)
return Alert.alert("Select category");

try{

const res = await api.post(
"/booking/request",
{
category:selectedCategory._id,
skills:selectedSkills,
interests:selectedInterests,
lat:userLocation.latitude,
lng:userLocation.longitude
}
);

navigation.navigate("Matching",{
bookingId:res.data.bookingId,
userLocation
});

}catch(e){
Alert.alert("No buddies available");
}

};



if(loading)
return(
<View style={styles.center}>
<ActivityIndicator size="large"/>
</View>
);



return(
<SafeAreaView style={styles.container}>
<StatusBar barStyle="dark-content"/>

<MapView
provider={PROVIDER_GOOGLE}
style={styles.map}
showsUserLocation
region={{
latitude:userLocation?.latitude || 17.385,
longitude:userLocation?.longitude || 78.4867,
latitudeDelta:0.05,
longitudeDelta:0.05
}}
>

<UserMarker location={userLocation}/>

{buddies.map(buddy=>(
<BuddyMarker
key={buddy._id}
buddy={buddy}
/>
))}

</MapView>



<View style={styles.panel}>

<FlatList
data={buddies}
keyExtractor={item=>item._id}
nestedScrollEnabled
showsVerticalScrollIndicator={false}
refreshing={refreshing}
onRefresh={fetchNearestBuddies}

ListHeaderComponent={

<View>

<Text style={styles.title}>Discovery</Text>

<Text style={styles.label}>Category</Text>

<ScrollView horizontal showsHorizontalScrollIndicator={false}>
{categories.map(c=>(
<TouchableOpacity
key={c._id}
onPress={()=>setSelectedCategory(c)}
style={[
styles.chip,
selectedCategory?._id===c._id && styles.activeChip
]}
>
<Text style={styles.chipText}>{c.name}</Text>
</TouchableOpacity>
))}
</ScrollView>


<Text style={styles.label}>Skills</Text>

<ScrollView horizontal showsHorizontalScrollIndicator={false}>
{availableSkills.map(s=>(
<TouchableOpacity
key={s._id}
onPress={()=>toggleSelection(
s._id,
selectedSkills,
setSelectedSkills
)}
style={[
styles.chip,
selectedSkills.includes(s._id)
&& styles.activeChip
]}
>
<Text style={styles.chipText}>{s.name}</Text>
</TouchableOpacity>
))}
</ScrollView>


<Text style={styles.label}>Interests</Text>

<ScrollView horizontal showsHorizontalScrollIndicator={false}>
{availableInterests.map(i=>(
<TouchableOpacity
key={i._id}
onPress={()=>toggleSelection(
i._id,
selectedInterests,
setSelectedInterests
)}
style={[
styles.chip,
selectedInterests.includes(i._id)
&& styles.activeChip
]}
>
<Text style={styles.chipText}>{i.name}</Text>
</TouchableOpacity>
))}
</ScrollView>


<TouchableOpacity
disabled={!selectedCategory}
style={[
styles.findBtn,
!selectedCategory && styles.disabledBtn
]}
onPress={handleStartMatching}
>
<Text style={styles.findText}>
FIND BEST BUDDY
</Text>
</TouchableOpacity>

<Text style={styles.nearby}>
Nearby Buddies
</Text>

</View>
}

renderItem={({item})=>(

<View style={styles.card}>

<Image
source={{
uri:item.profilePicture ||
"https://i.pravatar.cc/100"
}}
style={styles.avatar}
/>

<View>
<Text style={styles.name}>{item.name}</Text>
<Text style={styles.price}>₹{item.pricePerHour}/hr</Text>
<Text style={styles.online}>🟢 Online</Text>
</View>

</View>

)}
/>

</View>

</SafeAreaView>
);
}

const styles = StyleSheet.create({

container:{flex:1},
map:{flex:1},

panel:{
position:"absolute",
bottom:0,
left:0,
right:0,
height:"65%",
backgroundColor:"#fff",
padding:15,
borderTopLeftRadius:20,
borderTopRightRadius:20
},

title:{fontSize:18,fontWeight:"700"},
label:{marginTop:10,fontWeight:"600"},

chip:{
padding:8,
backgroundColor:"#eee",
borderRadius:20,
marginRight:8,
marginTop:8
},

activeChip:{backgroundColor:"#007AFF"},
chipText:{color:"#000"},

findBtn:{
backgroundColor:"#000",
padding:15,
borderRadius:12,
marginTop:10,
alignItems:"center"
},

disabledBtn:{backgroundColor:"#ccc"},

findText:{
color:"#fff",
fontWeight:"700"
},

nearby:{
marginTop:10,
fontWeight:"700"
},

card:{
flexDirection:"row",
padding:10,
borderBottomWidth:1,
borderColor:"#eee"
},

avatar:{
width:50,
height:50,
borderRadius:10,
marginRight:10
},

name:{fontWeight:"700"},
price:{color:"#34C759"},
online:{fontSize:12,color:"#34C759"},

center:{
flex:1,
justifyContent:"center",
alignItems:"center"
}

});