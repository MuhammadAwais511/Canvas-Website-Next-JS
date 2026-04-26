export type CanvasTool = "pen" | "eraser" | "line" | "rectangle" | "circle";

export type SavedCanvas = {
  id: string;
  title: string;
  image: string;
  createdAt: string;
  updatedAt: string;
};
