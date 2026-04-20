export const MAX_IMAGE_INPUT_BYTES = 5 * 1024 * 1024;
const MAX_DIMENSION = 400;
const JPEG_QUALITY = 0.8;

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read_failed"));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("decode_failed"));
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

/**
 * Converts an image file to a resized JPEG base64 data URL.
 * Rejects files that are not images or exceed MAX_IMAGE_INPUT_BYTES.
 * Dimensions are capped at MAX_DIMENSION × MAX_DIMENSION to keep the JSON small.
 */
export const imageFileToOptimizedDataUrl = async (file: File): Promise<string> => {
  if (!file.type.startsWith("image/")) {
    throw new Error("invalid_type");
  }
  if (file.size > MAX_IMAGE_INPUT_BYTES) {
    throw new Error("too_large");
  }

  const img = await loadImage(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("canvas_unavailable");
  }

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
};
