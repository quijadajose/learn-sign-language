export function isImageUrl(text: string): boolean {
  return Boolean(
    text &&
      (text.startsWith("http") ||
        text.startsWith("/images/") ||
        text.includes(".jpg") ||
        text.includes(".jpeg") ||
        text.includes(".png") ||
        text.includes(".gif") ||
        text.includes(".webp")),
  );
}
