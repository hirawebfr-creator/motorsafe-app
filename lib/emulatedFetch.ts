/**
 * Admin Emulation Fetch Wrapper
 * Automatically adds X-Emulate-Garage header when admin is emulating a garage
 */

import { getEmulatedGarageId } from "@/components/admin/GarageEmulator";

/**
 * Enhanced fetch that automatically includes emulation header for admins
 */
export async function emulatedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const garageId = getEmulatedGarageId();
  
  if (!garageId) {
    return fetch(input, init);
  }
  
  // Add emulation header
  const headers = new Headers(init?.headers);
  headers.set("X-Emulate-Garage", garageId.toString());
  
  return fetch(input, {
    ...init,
    headers,
  });
}

/**
 * Build URL with garageId query param for admin emulation
 */
export function withEmulatedGarage(url: string): string {
  const garageId = getEmulatedGarageId();
  if (!garageId) return url;
  
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}garageId=${garageId}`;
}
