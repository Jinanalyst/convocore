import Geolocation from "react-native-geolocation-service";
import { ensurePermissions } from "./permissions";
import { Platform } from "react-native";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export async function getCurrentLocation(): Promise<Coordinates> {
  const granted = await ensurePermissions(["location"]);
  if (!granted) throw new Error("Location permission denied");

  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (pos: Geolocation.GeoPosition) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err: Geolocation.GeoError) => reject(err),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
        forceRequestLocation: Platform.OS === "android",
      }
    );
  });
} 