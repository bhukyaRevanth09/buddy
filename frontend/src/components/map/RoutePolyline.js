import React from "react";
import { Polyline } from "react-native-maps";

export default function RoutePolyline({ coordinates }) {

if (!coordinates || coordinates.length < 2) return null;

return (
<Polyline
coordinates={coordinates}
strokeWidth={4}
strokeColor="#007AFF"
/>
);
}