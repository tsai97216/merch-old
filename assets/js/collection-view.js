document.addEventListener('DOMContentLoaded', () => {
  const collection = document.querySelector('#collection');
  if (!collection) return;

  const buttons = collection.querySelectorAll('[data-view]');
  const views = collection.querySelectorAll('[data-collection-view]');

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const view = button.dataset.view;
      buttons.forEach((item) => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      views.forEach((panel) => {
        panel.hidden = panel.dataset.collectionView !== view;
      });
    });
  });
});
