/** Minimal email shape check for client-side CTA gating (the API re-validates with Zod). */
export const isEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
