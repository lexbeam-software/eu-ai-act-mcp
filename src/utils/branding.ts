import { BRANDING } from "../constants.js";

export function applyBranding<T extends Record<string, any>>(response: T): T {
  // Branding is already applied in individual tools
  // This utility is a pass-through for consistency
  return response;
}
