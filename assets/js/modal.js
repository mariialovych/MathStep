/**
 * modal.js — доступне модальне вікно успіху MathStep.
 * Публічний API: window.MathStepModal.open(opener?) -> boolean, .close()
 * API створюється одразу, елементи DOM шукаються лише під час виклику.
 */
(() => {
  'use strict';

  let lastFocused = null; // елемент, з якого відкрили вікно

  const getModal = () => document.getElementById('successModal');
  const getCloseBtn = () => document.getElementById('successModalClose');

  /** Відкриває вікно. Повертає true, якщо вікно знайдено й показано */
  function open(opener) {
    const modal = getModal();
    if (!modal) return false;

    lastFocused = opener || document.activeElement;
    modal.hidden = false;
    document.body.classList.add('overflow-hidden');
    document.addEventListener('keydown', onKeydown);

    const closeBtn = getCloseBtn();
    if (closeBtn) closeBtn.focus(); // фокус одразу на «Закрити»
    return true;
  }

  /** Закриває вікно й повертає фокус туди, звідки його відкрили */
  function close() {
    const modal = getModal();
    if (modal) modal.hidden = true;

    document.body.classList.remove('overflow-hidden');
    document.removeEventListener('keydown', onKeydown);

    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    lastFocused = null;
  }

  /** Escape закриває вікно; Tab залишає фокус на кнопці */
  function onKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') {
      event.preventDefault();
      const closeBtn = getCloseBtn();
      if (closeBtn) closeBtn.focus();
    }
  }

  /** Вішає обробники кліків; безпечно викликається повторно */
  function bind() {
    const modal = getModal();
    const closeBtn = getCloseBtn();
    if (!modal || !closeBtn || modal.dataset.bound === '1') return;
    modal.dataset.bound = '1';

    closeBtn.addEventListener('click', close);
    // Клік по затемненню (але не по самому вікну) також закриває
    modal.addEventListener('mousedown', (event) => {
      if (event.target === modal) close();
    });
  }

  // 1) API доступний негайно, незалежно від стану документа
  window.MathStepModal = { open, close };

  // 2) Обробники кліків вішаємо, коли DOM готовий
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();