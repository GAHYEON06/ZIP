import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Place = {
  name: string;
  address?: string;
  lat: number;
  lng: number;
};

export type SafeRoute = {
  id: string;
  label: string;
  color: string;
  description: string;
  safetyScore: number; // 0-100
  distanceMeters: number;
  durationSeconds: number;
  path: google.maps.LatLngLiteral[];
  steps: RouteStep[];
  policeNearby: number;
  safetyFacilities: number;
};

export type RouteStep = {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  maneuver?: string;
  startLocation: google.maps.LatLngLiteral;
  endLocation: google.maps.LatLngLiteral;
};

type PersistState = {
  guardianName: string;
  guardianPhone: string;
  setGuardian: (name: string, phone: string) => void;
  clearGuardian: () => void;
};

type SessionState = {
  origin: Place | null;
  destination: Place | null;
  setOrigin: (p: Place | null) => void;
  setDestination: (p: Place | null) => void;
  routes: SafeRoute[];
  setRoutes: (r: SafeRoute[]) => void;
  selectedRouteId: string | null;
  setSelectedRouteId: (id: string | null) => void;
  navigating: boolean;
  setNavigating: (v: boolean) => void;
  currentPosition: google.maps.LatLngLiteral | null;
  setCurrentPosition: (p: google.maps.LatLngLiteral | null) => void;
  reset: () => void;
};

export const useGuardian = create<PersistState>()(
  persist(
    (set) => ({
      guardianName: "",
      guardianPhone: "",
      setGuardian: (guardianName, guardianPhone) => set({ guardianName, guardianPhone }),
      clearGuardian: () => set({ guardianName: "", guardianPhone: "" }),
    }),
    { name: "safe-route-guardian" },
  ),
);

export const useRouteStore = create<SessionState>((set) => ({
  origin: null,
  destination: null,
  setOrigin: (origin) => set({ origin }),
  setDestination: (destination) => set({ destination }),
  routes: [],
  setRoutes: (routes) => set({ routes }),
  selectedRouteId: null,
  setSelectedRouteId: (selectedRouteId) => set({ selectedRouteId }),
  navigating: false,
  setNavigating: (navigating) => set({ navigating }),
  currentPosition: null,
  setCurrentPosition: (currentPosition) => set({ currentPosition }),
  reset: () =>
    set({
      origin: null,
      destination: null,
      routes: [],
      selectedRouteId: null,
      navigating: false,
    }),
}));
