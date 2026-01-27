import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getApiPath(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // Avoid double prefixing if the path already starts with the base path
  if (basePath && normalizedPath.startsWith(basePath)) {
    return normalizedPath;
  }
  return `${basePath}${normalizedPath}`;
}
