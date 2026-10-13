import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getElapsedMs, formatElapsed } from '../js/timer.js';

test('getElapsedMs returns the millisecond difference', () => {
  const quitDate = new Date('2026-10-28T00:00:00');
  const now = new Date('2026-10-28T00:00:01.500');
  assert.equal(getElapsedMs(quitDate, now), 1500);
});

test('getElapsedMs clamps to zero before the quit date', () => {
  const quitDate = new Date('2026-10-28T00:00:00');
  const now = new Date('2026-10-27T23:59:00');
  assert.equal(getElapsedMs(quitDate, now), 0);
});

test('formatElapsed renders D:HH:MM:SS.mmm', () => {
  assert.equal(formatElapsed(0), '0:00:00:00.000');
  assert.equal(formatElapsed(1500), '0:00:00:01.500');
  assert.equal(formatElapsed(61 * 1000), '0:00:01:01.000');
});

test('formatElapsed rolls minutes, hours, and days correctly', () => {
  const oneDayOneHourOneMinOneSecOneTwentyThreeMs =
    ((24 + 1) * 3600 + 60 + 1) * 1000 + 123;
  assert.equal(formatElapsed(oneDayOneHourOneMinOneSecOneTwentyThreeMs), '1:01:01:01.123');
});

test('formatElapsed never caps days — counts up indefinitely', () => {
  const hundredDaysMs = 100 * 24 * 3600 * 1000;
  assert.equal(formatElapsed(hundredDaysMs), '100:00:00:00.000');
});
