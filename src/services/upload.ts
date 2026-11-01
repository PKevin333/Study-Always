import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable
} from 'firebase/storage';
import { storage } from '../firebase';
import { ErrorAttachment } from '../types';

export const MAX_ERROR_ATTACHMENTS = 5;
export const MAX_ERROR_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const ERROR_ATTACHMENT_ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

const safeFileName = (name: string) => name
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9._-]/g, '-')
  .replace(/-+/g, '-');

const loadImage = (file: File) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  const objectUrl = URL.createObjectURL(file);
  image.onload = () => {
    URL.revokeObjectURL(objectUrl);
    resolve(image);
  };
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error('Não foi possível processar a imagem.'));
  };
  image.src = objectUrl;
});

export async function compressErrorImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  const image = await loadImage(file);
  const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) return file;
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.8));
  if (!blob || blob.size >= file.size) return file;

  const baseName = file.name.replace(/\.[^.]+$/, '');
  return new File([blob], `${baseName}.webp`, { type: 'image/webp', lastModified: Date.now() });
}

export function validateErrorAttachment(file: File): string | null {
  if (!ERROR_ATTACHMENT_ACCEPT.includes(file.type)) {
    return `${file.name}: use PNG, JPG, WEBP ou PDF.`;
  }
  if (file.size > MAX_ERROR_ATTACHMENT_BYTES) {
    return `${file.name}: o limite é 5 MB por arquivo.`;
  }
  return null;
}

export async function uploadErrorAttachment(
  userId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<ErrorAttachment> {
  const preparedFile = await compressErrorImage(file);
  const fileId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const storageRef = ref(storage, `users/${userId}/errors/${fileId}-${safeFileName(preparedFile.name)}`);
  const task = uploadBytesResumable(storageRef, preparedFile, {
    contentType: preparedFile.type,
    customMetadata: { originalName: file.name }
  });

  await new Promise<void>((resolve, reject) => {
    task.on(
      'state_changed',
      snapshot => onProgress?.(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
      reject,
      resolve
    );
  });

  return {
    url: await getDownloadURL(task.snapshot.ref),
    nome: file.name,
    tipo: preparedFile.type,
    tamanho: preparedFile.size
  };
}

export async function deleteErrorAttachment(url: string): Promise<void> {
  if (!url) return;
  await deleteObject(ref(storage, url));
}
