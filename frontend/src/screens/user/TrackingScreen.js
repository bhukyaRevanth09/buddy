import React, { useContext } from "react";
import { View, Text } from "react-native";

import { SocketContext } from "../../context/socketContext.js";
import LiveMap from "../../components/LiveMap.js";
import { useLiveTracking } from "../../../hooks/useLiveLocation.js";
import { calculateDistance } from "../../../hooks/useDistance.js";

export default function TrackingScreen({ route }) {

  const { socket } = useContext(SocketContext);

  const { bookingId, userLocation } = route.params;

  const buddyLocation = useLiveTracking(socket, bookingId);

  const distance = calculateDistance(
    userLocation,
    buddyLocation
  );

  return (
    <View style={{ flex: 1 }}>

      <LiveMap
        userLocation={userLocation}
        buddyLocation={buddyLocation}
      />

      <View style={{
        position:"absolute",
        bottom:40,
        left:20,
        right:20,
        backgroundColor:"#fff",
        padding:15,
        borderRadius:10
      }}>
        <Text>Distance: {distance} km</Text>
      </View>

    </View>
  );
}