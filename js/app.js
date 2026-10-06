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
    img.alt = vm.label;
    img.loading = 'lazy';
    img.decoding = 'async';
    el.appendChild(img);

    const caption = document.createElement('p');
    caption.textContent = vm.owned
      ? `${vm.label} — collected ${vm.ownedDate}`
      : vm.isNextUp
        ? `${vm.label} — next up!`
        : vm.label;
    el.appendChild(caption);

    const idLine = document.createElement('code');
    idLine.className = 'card-id';
    idLine.textContent = vm.id;
    el.appendChild(idLine);

    container.appendChild(el);
  }
}

init();
