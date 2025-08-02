import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function setToken(token: string) {
  localStorage.setItem("token", token)
}

export function getToken() {
  return localStorage.getItem("token")
}

export function isAuthenticated() {
  return !!getToken()
}

export function logout() {
  localStorage.removeItem("token")
}


export function parseAccelerometerHexData(hexString: string) {
  const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString
  const timestamp = parseInt(cleanHex.slice(0, 8), 16)
  const x = parseInt(cleanHex.slice(12, 16), 16) << 16 >> 16
  const y = parseInt(cleanHex.slice(16, 20), 16) << 16 >> 16
  const z = parseInt(cleanHex.slice(20, 24), 16) << 16 >> 16
  return { timestamp, x, y, z }
}


export function parseTemperatureHex(hexString: string) {
  const cleanHex = hexString.startsWith("0x") ? hexString.slice(2) : hexString;
  const timestampHex = cleanHex.slice(0, 8);
  const temperatureHex = cleanHex.slice(8, 12);

  const readableTimestamp = parseInt(timestampHex, 16);
  const readableTemperature = parseInt(temperatureHex, 16) / 10;

  return {
    timestamp: readableTimestamp,
    temperature: readableTemperature,
  };
}

export function parseAllSensorData(hexString: string) {
  return {
    temperature: parseTemperatureHex(hexString),
    accelerometer: parseAccelerometerHexData(hexString),
  }
}