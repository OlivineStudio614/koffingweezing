// js/app.js
import { buildCardViewModel } from './cards.js';

async function init() {
  try {
    const response = await fetch('data/cards.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch data/cards.json: ${response.status} ${response.statusText}`);
    }
    const cards = await response.json();
    render(buildCardViewModel(cards));
  } catch (err) {
    console.error(err);
    const container = document.getElementById('card-grid');
    container.textContent = 'Could not load card data — please try again.';
  }
}

function render(viewModels) {
  const container = document.getElementById('card-grid');
  container.innerHTML = '';

  for (const vm of viewModels) {
    const el = document.createElement('div');
    el.className = `card ${vm.owned ? 'owned' : 'unowned'}${vm.isNextUp ? ' next-up' : ''}`;
    el.dataset.id = vm.id;

    const img = document.createElement('img');
    img.src = vm.imageUrl;
    img.alt = vm.labelEn;
    img.loading = 'lazy';
    img.decoding = 'async';
    el.appendChild(img);

    const captionEn = document.createElement('p');
    captionEn.className = 'card-label-en';
    captionEn.textContent = vm.labelEn;
    el.appendChild(captionEn);

    if (vm.labelNative) {
      const captionNative = document.createElement('p');
      captionNative.className = 'card-label-native';
      captionNative.textContent = vm.labelNative;
      el.appendChild(captionNative);
    }

    const status = document.createElement('p');
    status.className = 'card-status';
    status.textContent = vm.owned
      ? `collected ${vm.ownedDate}`
      : vm.isNextUp
        ? 'next up!'
        : '';
    if (status.textContent) {
      el.appendChild(status);
    }

    const idLine = document.createElement('code');
    idLine.className = 'card-id';
    idLine.textContent = vm.id;
    el.appendChild(idLine);

    container.appendChild(el);
  }
}

init();
