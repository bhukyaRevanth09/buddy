import { useEffect, useState, useCallback } from "react";
import api from "../api/Apiclient";

export default function useNearbyBuddies(
location,
category,
skills,
interests,
socket
){

const [buddies,setBuddies] = useState([]);
const [loading,setLoading] = useState(false);

const fetchBuddies = useCallback(async()=>{

if(!location) return;

setLoading(true);

try{

const res = await api.get(
"/user/nearest-buddy",
{
params:{
latitude:location.latitude,
longitude:location.longitude,
categoryId:category?._id,
skillIds:skills.join(","),
interestIds:interests.join(",")
}
});

setBuddies(res.data.data || []);

}catch(e){}

setLoading(false);

},[location,category,skills,interests]);

useEffect(()=>{
fetchBuddies();
},[fetchBuddies]);



/* realtime online/offline */
useEffect(()=>{

if(!socket) return;

socket.on("buddy_status_updated",(data)=>{

if(!data.isOnline){
setBuddies(prev =>
prev.filter(b=>b._id!==data.buddyId)
);
}else{
fetchBuddies();
}

});

return ()=>socket.off("buddy_status_updated");

},[socket]);

return { buddies, loading, refresh:fetchBuddies };

}