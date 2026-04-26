import { getStoredValue, setStoredValue } from "@/lib/local-storage";
import type { SavedCanvas } from "@/types/canvas";

const STORAGE_KEY = "canvasstudio_saved_canvases";

export function fetchSavedCanvases() {
  return getStoredValue<SavedCanvas[]>(STORAGE_KEY, []);
}

export function getSavedCanvas(id: string) {
  return fetchSavedCanvases().find((item) => item.id === id);
}

export function saveCanvasDrawing(canvas: SavedCanvas) {
  const list = fetchSavedCanvases();
  const next = [canvas, ...list.filter((item) => item.id !== canvas.id)];
  setStoredValue(STORAGE_KEY, next);
  return next;
}

export function removeSavedCanvas(id: string) {
  const next = fetchSavedCanvases().filter((item) => item.id !== id);
  setStoredValue(STORAGE_KEY, next);
  return next;
}

export function updateSavedCanvas(id: string, updates: Partial<SavedCanvas>) {
  const next = fetchSavedCanvases().map((item) => (item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item));
  setStoredValue(STORAGE_KEY, next);
  return next;
}
