const modules = import.meta.glob('../assets/laminas/*.{png,jpg,jpeg,webp,gif,jfif,PNG,JPG,JPEG,WEBP,GIF,JFIF}', { eager: true });

export const laminaByFile = {};
for (const path in modules) {
  const name = path.split('/').pop();
  laminaByFile[name] = modules[path].default;
}

export const laminaExtensions = Object.keys(laminaByFile);

export function laminaUrl(imagePath) {
  if (!imagePath) return null;
  const name = imagePath.split('/').pop();
  return laminaByFile[name] || imagePath;
}