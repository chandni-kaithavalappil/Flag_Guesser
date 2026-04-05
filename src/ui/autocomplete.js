import countries, { filterCountriesByQuery } from '../game/countries.js';

/**
 * @typedef {(code: string) => void} SubmitHandler
 */

/**
 * @typedef {{ close: () => void; cleanup: () => void }} AutocompleteController
 */

/**
 * Attaches autocomplete behaviour to an input and calls back with ISO codes.
 * Returns a controller for programmatic close and listener cleanup.
 *
 * @param {HTMLInputElement | null} input
 * @param {SubmitHandler} onSubmitCode
 * @returns {AutocompleteController}
 */
export function initAutocomplete(input, onSubmitCode) {
  if (!input) {
    return { close: () => {}, cleanup: () => {} };
  }

  let listEl = null;
  let activeItems = [];
  let activeIndex = -1;

  function closeList() {
    listEl?.remove();
    listEl = null;
    activeItems = [];
    activeIndex = -1;
  }

  function setActive(index) {
    const lis = listEl.querySelectorAll('li[data-code]');
    lis.forEach((li, i) => li.classList.toggle('active', i === index));
    activeIndex = index;
  }

  function openList(items) {
    closeList();
    activeItems = items.slice(0, 12);
    listEl = document.createElement('ul');
    listEl.className = 'autocomplete-list';
    listEl.setAttribute('role', 'listbox');

    if (activeItems.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No matches';
      li.className = 'autocomplete-empty';
      listEl.appendChild(li);
    } else {
      for (const c of activeItems) {
        const li = document.createElement('li');
        li.textContent = c.name;
        li.dataset.code = c.code;
        li.setAttribute('role', 'option');
        li.addEventListener('mousedown', (e) => {
          e.preventDefault();
          onSubmitCode(c.code);
          input.value = '';
          closeList();
        });
        listEl.appendChild(li);
      }
    }

    input.parentElement?.appendChild(listEl);
  }

  input.addEventListener('input', () => {
    const q = input.value;
    const items = filterCountriesByQuery(countries, q);
    openList(items);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeList();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (listEl && activeItems.length > 0) {
        setActive(Math.min(activeIndex + 1, activeItems.length - 1));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (listEl && activeItems.length > 0) {
        setActive(Math.max(activeIndex - 1, 0));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (listEl && activeItems.length > 0) {
        const idx = activeIndex >= 0 ? activeIndex : 0;
        onSubmitCode(activeItems[idx].code);
        input.value = '';
        closeList();
      }
    }
  });

  const handleDocClick = (e) => {
    if (e.target !== input && !listEl?.contains(e.target)) {
      closeList();
    }
  };
  document.addEventListener('click', handleDocClick);

  return {
    close: closeList,
    cleanup: () => {
      document.removeEventListener('click', handleDocClick);
      closeList();
    },
  };
}
