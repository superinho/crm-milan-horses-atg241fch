/* General utility functions (exposes cn) */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Determines whether text should be black or white depending on the background color.
 * @param hexcolor - Hexadecimal color string
 * @returns 'black' or 'white'
 */
export function getContrastColor(hexcolor: string) {
  // If invalid hex (e.g. tailwind class), default to white text
  if (!hexcolor || !/^#[0-9A-F]{6}$/i.test(hexcolor)) return 'white'

  const r = parseInt(hexcolor.substring(1, 3), 16)
  const g = parseInt(hexcolor.substring(3, 5), 16)
  const b = parseInt(hexcolor.substring(5, 7), 16)

  const yiq = (r * 299 + g * 587 + b * 114) / 1000

  return yiq >= 128 ? 'black' : 'white'
}
