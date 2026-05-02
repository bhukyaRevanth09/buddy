import React from "react";
import { Polyline } from "react-native-maps";

export default function RoutePolyline({ coordinates }) {

  if (!coordinates || coordinates.length < 2) return null;

  return (
    <Polyline
      key={`${coordinates[1]?.latitude}-${coordinates[1]?.longitude}`}
      coordinates={coordinates}
      strokeWidth={4}
      strokeColor="#007AFF"
      lineJoin="round"
      lineCap="round"
    />
  );
}