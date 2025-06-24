import { Platform } from "react-native";
import {
  checkMultiple,
  requestMultiple,
  PERMISSIONS,
  RESULTS,
} from "react-native-permissions";
import { getConsent } from "./consent";

export type PermissionName = "contacts" | "calendar" | "location";

const permissionMap: Record<PermissionName, string> = {
  contacts:
    Platform.OS === "ios" ? PERMISSIONS.IOS.CONTACTS : PERMISSIONS.ANDROID.READ_CONTACTS,
  calendar:
    Platform.OS === "ios" ? PERMISSIONS.IOS.CALENDARS : PERMISSIONS.ANDROID.READ_CALENDAR,
  location:
    Platform.OS === "ios" ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
};

export async function ensurePermissions(names: PermissionName[]): Promise<boolean> {
  // First, verify user consent toggles
  for (const n of names) {
    const consent = await getConsent(n);
    if (!consent) {
      return false; // user opted out
    }
  }

  const perms = names.map((n) => permissionMap[n]);

  const statuses = await checkMultiple(perms as any);
  const needRequest = perms.filter((p) => statuses[p] !== RESULTS.GRANTED);

  if (needRequest.length > 0) {
    const reqRes = await requestMultiple(needRequest as any);
    return needRequest.every((p) => reqRes[p] === RESULTS.GRANTED);
  }
  return true;
} 