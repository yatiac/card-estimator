import {Timestamp} from "firebase-admin/firestore";
import {getAuth} from "firebase-admin/auth";

export interface CustomClaims {
  stripeRole?: "premium";
}
export interface RoomAccess {
  [roomId: string]: RoomAccessValue;
}

export interface RoomAccessValue {
  hash: string;
  roomId: string;
}

export async function getCustomClaims(userId: string): Promise<CustomClaims> {
  const user = await getAuth().getUser(userId);
  const currentClaims: CustomClaims = user.customClaims || {};
  return currentClaims;
}
