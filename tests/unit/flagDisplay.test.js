import { describe, it, expect, beforeEach } from 'vitest';
import { updateFlagBlur } from '../../src/ui/flagDisplay.js';

describe('updateFlagBlur', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  it('does nothing when container is null', () => {
    expect(() => updateFlagBlur(null, 'https://example.com/flag.svg', 10)).not.toThrow();
  });

  it('creates an img element when none exists', () => {
    updateFlagBlur(container, 'https://example.com/flag.svg', 10);
    const img = container.querySelector('img.flag-img');
    expect(img).not.toBeNull();
  });

  it('sets the src to the provided flagUrl', () => {
    updateFlagBlur(container, 'https://example.com/flag.svg', 10);
    const img = container.querySelector('img.flag-img');
    expect(img.src).toBe('https://example.com/flag.svg');
  });

  it('applies the blur filter style', () => {
    updateFlagBlur(container, 'https://example.com/flag.svg', 15);
    const img = container.querySelector('img.flag-img');
    expect(img.style.filter).toBe('blur(15px)');
  });

  it('applies blur 0 when fully revealed', () => {
    updateFlagBlur(container, 'https://example.com/flag.svg', 0);
    const img = container.querySelector('img.flag-img');
    expect(img.style.filter).toBe('blur(0px)');
  });

  it('reuses existing img element on subsequent calls', () => {
    updateFlagBlur(container, 'https://example.com/flag.svg', 10);
    const firstImg = container.querySelector('img.flag-img');
    updateFlagBlur(container, 'https://example.com/other.svg', 5);
    const secondImg = container.querySelector('img.flag-img');
    expect(container.querySelectorAll('img.flag-img')).toHaveLength(1);
    expect(secondImg.src).toBe('https://example.com/other.svg');
    expect(secondImg.style.filter).toBe('blur(5px)');
    // second call reuses the same element
    expect(firstImg).toBe(secondImg);
  });

  it('sets width and height on the created img', () => {
    updateFlagBlur(container, 'https://example.com/flag.svg', 0);
    const img = container.querySelector('img.flag-img');
    expect(img.width).toBe(320);
    expect(img.height).toBe(200);
  });
});
