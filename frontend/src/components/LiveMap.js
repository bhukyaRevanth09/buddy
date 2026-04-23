import React, { useEffect, useRef } from "react";
import MapView, { Marker, Polyline } from "react-native-maps";

export default function LiveMap({
  userLocation,
  buddyLocation,
  route
}) {

  const mapRef = useRef(null);

  useEffect(() => {
    if (userLocation && buddyLocation) {
      mapRef.current?.fitToCoordinates(
        [userLocation, buddyLocation],
        {
          edgePadding: {
            top: 100,
            right: 100,
            bottom: 100,
            left: 100
          },
          animated: true
        }
      );
    }
  }, [userLocation, buddyLocation]);

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      showsUserLocation
    >
      {userLocation && (
        <Marker
          coordinate={userLocation}
          title="You"
          pinColor="blue"
        />
      )}

      {buddyLocation && (
        <Marker
          coordinate={buddyLocation}
          title="Buddy"
          pinColor="green"
        />
      )}

      {route && (
        <Polyline
          coordinates={route}
          strokeWidth={4}
          strokeColor="#007AFF"
        />
      )}
    </MapView>
  );
}