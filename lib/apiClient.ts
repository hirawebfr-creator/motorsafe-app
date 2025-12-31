// Helper to standardize API responses for lists and items
export function unwrapList<T = any>(json: any): T[] {
  if (Array.isArray(json)) return json as T[];
  if (!json) return [];
  if (Array.isArray(json.data)) return json.data as T[];
  if (Array.isArray(json.clients)) return json.clients as T[];
  if (Array.isArray(json.vehicles)) return json.vehicles as T[];
  if (Array.isArray(json.interventions)) return json.interventions as T[];
  if (json.ok && Array.isArray(json.data)) return json.data as T[];
  return [];
}

export function unwrapItem<T = any>(json: any): T | null {
  if (!json) return null;
  if (json.data && typeof json.data === "object") return json.data as T;
  if (json.client) return json.client as T;
  if (json.vehicle) return json.vehicle as T;
  if (json.intervention) return json.intervention as T;
  return typeof json === "object" ? (json as T) : null;
}
