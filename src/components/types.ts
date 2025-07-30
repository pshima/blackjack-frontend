import type { ReactNode } from 'react';

/**
 * Base component props that all components can extend
 */
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  testId?: string;
}

/**
 * Props for loading components
 */
export interface LoadingProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

/**
 * Props for error display components
 */
export interface ErrorProps extends BaseComponentProps {
  error: string | Error;
  retry?: () => void;
  showDetails?: boolean;
  variant?: 'inline' | 'card' | 'alert';
}

/**
 * Common button variants and sizes
 */
export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
}

/**
 * Card component styling variants
 */
export interface CardVariant {
  size?: 'sm' | 'md' | 'lg';
  style?: 'classic' | 'modern' | 'minimal';
  shadow?: boolean;
  border?: boolean;
}

/**
 * Animation timing and easing options
 */
export interface AnimationOptions {
  duration?: number;
  delay?: number;
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

/**
 * Accessibility props for interactive components
 */
export interface AccessibilityProps {
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
  role?: string;
  tabIndex?: number;
}