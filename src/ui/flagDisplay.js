/**
 * Renders or updates the flag image with blur.
 *
 * @param {HTMLElement | null} container
 * @param {string} flagUrl
 * @param {number} blurPx
 */
export function updateFlagBlur(container, flagUrl, blurPx) {
  if (!container) {
    return;
  }
  let img = container.querySelector('img.flag-img');
  if (!img) {
    img = document.createElement('img');
    img.className = 'flag-img';
    img.alt = '';
    img.width = 320;
    img.height = 200;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    container.replaceChildren(img);
  }
  img.src = flagUrl;
  img.style.filter = `blur(${blurPx}px)`;
}
