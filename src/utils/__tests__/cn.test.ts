import { describe, it, expect } from 'vitest';
import { cn, commonClasses, focusRing, srOnly, responsive } from '../cn';

describe('cn utility function', () => {
  it('should combine class names correctly', () => {
    const result = cn('class1', 'class2', 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  it('should handle conditional classes', () => {
    const shouldShow = true;
    const shouldHide = false;
    const result = cn('base', shouldShow && 'conditional', shouldHide && 'hidden');
    expect(result).toBe('base conditional');
  });

  it('should handle undefined and null values', () => {
    const result = cn('base', undefined, null, 'active');
    expect(result).toBe('base active');
  });

  it('should handle empty strings and arrays', () => {
    const result = cn('base', '', [], 'active');
    expect(result).toBe('base active');
  });

  it('should handle objects with boolean values', () => {
    const result = cn('base', {
      active: true,
      disabled: false,
      loading: true,
    });
    expect(result).toBe('base active loading');
  });

  it('should handle mixed input types', () => {
    const result = cn(
      'base',
      ['array-class1', 'array-class2'],
      { conditional: true, hidden: false },
      undefined,
      'final'
    );
    expect(result).toBe('base array-class1 array-class2 conditional final');
  });
});

describe('commonClasses', () => {
  it('should have button variants', () => {
    expect(commonClasses.button.base).toContain('inline-flex');
    expect(commonClasses.button.primary).toContain('bg-primary-600');
    expect(commonClasses.button.secondary).toContain('bg-gray-200');
    expect(commonClasses.button.danger).toContain('bg-red-600');
    expect(commonClasses.button.ghost).toContain('bg-transparent');
  });

  it('should have card variants', () => {
    expect(commonClasses.card.base).toContain('bg-white');
    expect(commonClasses.card.hover).toContain('hover:shadow-card-hover');
    expect(commonClasses.card.interactive).toContain('cursor-pointer');
  });

  it('should have input variants', () => {
    expect(commonClasses.input.base).toContain('block w-full');
    expect(commonClasses.input.error).toContain('border-red-300');
  });

  it('should have layout helpers', () => {
    expect(commonClasses.layout.container).toContain('mx-auto');
    expect(commonClasses.layout.section).toContain('py-8');
    expect(commonClasses.layout.grid).toContain('grid gap-4');
  });

  it('should have animation classes', () => {
    expect(commonClasses.animation.fadeIn).toContain('animate-in fade-in');
    expect(commonClasses.animation.slideUp).toContain('slide-in-from-bottom-4');
    expect(commonClasses.animation.scaleIn).toContain('zoom-in-95');
  });
});

describe('helper constants', () => {
  it('should have focus ring-3 styles', () => {
    expect(focusRing).toContain('focus-visible:outline-hidden');
    expect(focusRing).toContain('focus-visible:ring-2');
    expect(focusRing).toContain('focus-visible:ring-primary-500');
  });

  it('should have screen reader only class', () => {
    expect(srOnly).toBe('sr-only');
  });

  it('should have responsive breakpoints', () => {
    expect(responsive.sm).toBe('sm:');
    expect(responsive.md).toBe('md:');
    expect(responsive.lg).toBe('lg:');
    expect(responsive.xl).toBe('xl:');
    expect(responsive['2xl']).toBe('2xl:');
  });
});

describe('integration with actual styling', () => {
  it('should create complete button classes', () => {
    const buttonClass = cn(
      commonClasses.button.base,
      commonClasses.button.primary,
      focusRing
    );
    expect(buttonClass).toContain('inline-flex');
    expect(buttonClass).toContain('bg-primary-600');
    expect(buttonClass).toContain('focus-visible:ring-2');
  });

  it('should create conditional card classes', () => {
    const isInteractive = true;
    const cardClass = cn(
      commonClasses.card.base,
      {
        [commonClasses.card.hover]: isInteractive,
        [commonClasses.card.interactive]: isInteractive,
      }
    );
    expect(cardClass).toContain('bg-white');
    expect(cardClass).toContain('hover:shadow-card-hover');
    expect(cardClass).toContain('cursor-pointer');
  });
});