import { FILTER_OPTIONS, getDefaultFilters } from "./data.js";

export const MOB_FILTER_KEY = "memory_mode_mob_filters";

export function readSelectedFilters() {
  try {
    const raw = localStorage.getItem(MOB_FILTER_KEY);
    if (!raw) return getDefaultFilters();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return getDefaultFilters();
    return parsed.filter((item) => FILTER_OPTIONS.includes(item));
  } catch {
    return getDefaultFilters();
  }
}
