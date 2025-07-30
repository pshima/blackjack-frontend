import { clsx, type ClassValue } from 'clsx';

/**
 * Utility function for combining class names
 * Uses clsx internally for conditional and dynamic class handling
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Predefined class combinations for common UI patterns
 */
export const commonClasses = {
  // Button variants
  button: {
    base: 'inline-flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
  },
  
  // Card variants
  card: {
    base: 'bg-white border rounded-card shadow-card transition-all duration-200',
    hover: 'hover:shadow-card-hover hover:scale-102',
    interactive: 'cursor-pointer select-none',
  },
  
  // Input variants
  input: {
    base: 'block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500',
    error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
  },
  
  // Layout helpers
  layout: {
    container: 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8',
    section: 'py-8 sm:py-12 lg:py-16',
    grid: 'grid gap-4 sm:gap-6 lg:gap-8',
  },
  
  // Animation classes
  animation: {
    fadeIn: 'animate-in fade-in duration-200',
    slideUp: 'animate-in slide-in-from-bottom-4 duration-300',
    scaleIn: 'animate-in zoom-in-95 duration-200',
  },
} as const;

/**
 * Helper for focus-visible styling
 */
export const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2';

/**
 * Helper for screen reader only content
 */
export const srOnly = 'sr-only';

/**
 * Helper for responsive breakpoints
 */
export const responsive = {
  sm: 'sm:',
  md: 'md:',
  lg: 'lg:',
  xl: 'xl:',
  '2xl': '2xl:',
} as const;