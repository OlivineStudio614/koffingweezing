// js/app.js
import { buildCardViewModel } from './cards.js';

async function init() {
  const response = await fetch('data/cards.json');
  const cards = await response.json();
  render(buildCardViewModel(cards));
}

function render(viewModels) {
  const container = document.getElementById('card-grid');
  container.innerHTML = '';

  for (const vm of viewModels) {
    const el = document.createElement('div');
    el.className = `card ${vm.owned ? 'owned' : 'unowned'}${vm.isNextUp ? ' next-up' : ''}`;

    const img = document.createElement('img');
    img.src = vm.imageUrl;
    img.alt = vm.label;
    el.appendChild(img);

    const caption = document.createElement('p');
    caption.textContent = vm.owned
      ? `${vm.label} — collected ${vm.ownedDate}`
      : vm.isNextUp
        ? `${vm.label} — next up!`
        : vm.label;
    el.appendChild(caption);

    container.appendChild(el);
  }
}

init();
