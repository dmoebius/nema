import { supabase } from "./supabase";

const AVATAR_SIZE = 256;
const AVATAR_QUALITY = 0.85;

/**
 * Resizes an image file to AVATAR_SIZE x AVATAR_SIZE using Canvas API.
 * Returns a Blob in JPEG format.
 */
async function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = AVATAR_SIZE;
      canvas.height = AVATAR_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));

      // Cover-fit: crop to square from center
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        },
        "image/jpeg",
        AVATAR_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image load failed"));
    };

    img.src = url;
  });
}

/**
 * Uploads an avatar image to Supabase Storage.
 * Resizes to 256x256 JPEG before upload.
 * Returns the public URL of the uploaded avatar.
 */
export async function uploadAvatar(userId: string, contactId: string, file: File): Promise<string> {
  const blob = await resizeImage(file);
  const path = `${userId}/${contactId}.jpg`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, blob, { contentType: "image/jpeg", upsert: true });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  // Append cache-busting timestamp to force refresh after re-upload
  return `${data.publicUrl}?t=${Date.now()}`;
}

/**
 * Deletes an avatar from Supabase Storage.
 */
export async function deleteAvatar(userId: string, contactId: string): Promise<void> {
  const path = `${userId}/${contactId}.jpg`;
  await supabase.storage.from("avatars").remove([path]);
}
