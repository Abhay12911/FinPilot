/**
 * Stale-While-Revalidate LocalStorage cache utility for FinPilot UI.
 * Allows components to render last-known data instantly while fetching updates in the background.
 */

export const getCachedData = (key, fallback = null) => {
  try {
    const item = localStorage.getItem(`finpilot_${key}`);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (e) {
    return fallback;
  }
};

export const setCachedData = (key, data) => {
  try {
    if (data !== undefined && data !== null) {
      localStorage.setItem(`finpilot_${key}`, JSON.stringify(data));
    }
  } catch (e) {
    // Ignore storage quota or disabled errors
  }
};
