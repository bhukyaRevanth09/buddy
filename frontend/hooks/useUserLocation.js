import { useEffect, useState } from "react";
import * as Location from "expo-location";

export default function useUserLocation() {

const [location,setLocation] = useState(null);

useEffect(()=>{

let subscriber;

(async()=>{

const { status } =
await Location.requestForegroundPermissionsAsync();

if(status !== "granted") return;

subscriber =
await Location.watchPositionAsync(
{
accuracy:Location.Accuracy.High,
timeInterval:3000,
distanceInterval:5
},
(loc)=>{
setLocation({
latitude:loc.coords.latitude,
longitude:loc.coords.longitude
});
}
);

})();

return ()=>{
subscriber?.remove();
};

},[]);

return location;

}