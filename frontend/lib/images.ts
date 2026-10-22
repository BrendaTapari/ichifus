const MAX_EDGE = 2048;

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer una foto. Elegila de nuevo desde la galería."));
    };
    image.src = url;
  });
}

async function toJpeg(file: File) {
  const image = await loadImage(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
  if (!blob) return file;
  const base = file.name.replace(/\.[^.]+$/, "") || "foto";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}

export async function prepareGalleryFiles(list: FileList | File[]) {
  const files = Array.from(list);
  if (!files.length) return [];
  const prepared: File[] = [];
  for (const file of files) {
    const looksLikeImage = file.type.startsWith("image/") || /\.(heic|heif|jpe?g|png|webp|gif)$/i.test(file.name);
    if (!looksLikeImage) {
      throw new Error("Elegí fotos desde la galería del celular");
    }
    prepared.push(file.type === "image/gif" ? file : await toJpeg(file));
  }
  return prepared;
}
