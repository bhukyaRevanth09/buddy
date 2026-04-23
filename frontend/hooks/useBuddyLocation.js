import { useEffect, useState } from "react";

export default function useBuddyLocation(socket){

const [buddyLocation,setBuddyLocation] = useState(null);

useEffect(()=>{

if(!socket) return;

socket.on("location_update",(data)=>{

setBuddyLocation({
latitude:data.lat,
longitude:data.lng,
buddyId:data.buddyId
});

});

return ()=>{
socket.off("location_update");
};

},[socket]);

return buddyLocation;

}