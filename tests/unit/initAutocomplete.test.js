import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initAutocomplete } from '../../src/ui/autocomplete.js';

describe('initAutocomplete', () => {
  let input, wrapper, submitted;

  beforeEach(() => {
    wrapper = document.createElement('div');
    input = document.createElement('input');
    wrapper.appendChild(input);
    document.body.appendChild(wrapper);
    submitted = [];
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns a controller with close and cleanup when input is null', () => {
    const ctrl = initAutocomplete(null, () => {});
    expect(typeof ctrl.close).toBe('function');
    expect(typeof ctrl.cleanup).toBe('function');
    expect(() => ctrl.close()).not.toThrow();
    expect(() => ctrl.cleanup()).not.toThrow();
  });

  it('opens a list on input event', () => {
    initAutocomplete(input, (code) => submitted.push(code));
    input.value = 'fra';
    input.dispatchEvent(new Event('input'));
    const list = wrapper.querySelector('.autocomplete-list');
    expect(list).not.toBeNull();
  });

  it('shows "No matches" item when query has no results', () => {
    initAutocomplete(input, (code) => submitted.push(code));
    input.value = 'zzzznonexistent';
    input.dispatchEvent(new Event('input'));
    const emptyLi = wrapper.querySelector('.autocomplete-empty');
    expect(emptyLi).not.toBeNull();
    expect(emptyLi.textContent).toBe('No matches');
  });

  it('closes the list on Escape key', () => {
    initAutocomplete(input, (code) => submitted.push(code));
    input.value = 'fra';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(wrapper.querySelector('.autocomplete-list')).toBeNull();
  });

  it('submits first item on Enter when no item is active', () => {
    initAutocomplete(input, (code) => submitted.push(code));
    input.value = 'france';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(submitted).toHaveLength(1);
    expect(submitted[0]).toBe('FR');
  });

  it('navigates down with ArrowDown', () => {
    initAutocomplete(input, (code) => submitted.push(code));
    input.value = 'fra';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    const activeLi = wrapper.querySelector('li.active');
    expect(activeLi).not.toBeNull();
  });

  it('navigates up with ArrowUp', () => {
    initAutocomplete(input, (code) => submitted.push(code));
    input.value = 'fra';
    input.dispatchEvent(new Event('input'));
    // go down first
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    const activeLi = wrapper.querySelector('li.active');
    expect(activeLi).not.toBeNull();
  });

  it('submits active item on Enter after ArrowDown', () => {
    initAutocomplete(input, (code) => submitted.push(code));
    input.value = 'fra';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(submitted).toHaveLength(1);
  });

  it('closes list on document click outside input', () => {
    initAutocomplete(input, (code) => submitted.push(code));
    input.value = 'fra';
    input.dispatchEvent(new Event('input'));
    const outsideEl = document.createElement('div');
    document.body.appendChild(outsideEl);
    outsideEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(wrapper.querySelector('.autocomplete-list')).toBeNull();
  });

  it('submits code on mousedown on a list item', () => {
    initAutocomplete(input, (code) => submitted.push(code));
    input.value = 'france';
    input.dispatchEvent(new Event('input'));
    const li = wrapper.querySelector('li[data-code="FR"]');
    expect(li).not.toBeNull();
    li.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(submitted).toContain('FR');
  });

  it('cleanup removes document click listener and closes list', () => {
    const ctrl = initAutocomplete(input, (code) => submitted.push(code));
    input.value = 'fra';
    input.dispatchEvent(new Event('input'));
    ctrl.cleanup();
    expect(wrapper.querySelector('.autocomplete-list')).toBeNull();
  });

  it('ArrowDown does nothing when list is closed', () => {
    initAutocomplete(input, (code) => submitted.push(code));
    // no input event, list not open
    expect(() =>
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    ).not.toThrow();
  });

  it('ArrowUp does nothing when list is closed', () => {
    initAutocomplete(input, (code) => submitted.push(code));
    expect(() =>
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }))
    ).not.toThrow();
  });

  it('Enter does nothing when list is closed', () => {
    initAutocomplete(input, (code) => submitted.push(code));
    expect(() =>
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    ).not.toThrow();
    expect(submitted).toHaveLength(0);
  });
});
