// js/timer.js
export const QUIT_DATE = new Date('2026-10-12T04:20:00-04:00');

const PAD2 = n => String(n).padStart(2, '0');
const PAD3 = n => String(n).padStart(3, '0');

export function getElapsedMs(quitDate, now) {
  return Math.max(0, now.getTime() - quitDate.getTime());
}

export function formatElapsed(elapsedMs) {
  const ms = elapsedMs % 1000;
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;
  const days = Math.floor(totalHours / 24);

  return `${days}:${PAD2(hours)}:${PAD2(minutes)}:${PAD2(seconds)}.${PAD3(ms)}`;
}

export function startTimer(el, quitDate = QUIT_DATE) {
  function tick() {
    el.textContent = formatElapsed(getElapsedMs(quitDate, new Date()));
    requestAnimationFrame(tick);
  }
  tick();
}
