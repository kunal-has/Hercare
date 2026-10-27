import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WELLNESS_MESSAGES,
  getDailyGreetingIndex,
  formatDailyGreetingMessage,
  getDailyWellnessGreeting,
  type WellnessCategory,
} from './greetingService.ts';

test('1. Message collection contains at least 30 warm wellness messages across 6 categories', () => {
  assert.ok(WELLNESS_MESSAGES.length >= 30, `Expected at least 30 messages, got ${WELLNESS_MESSAGES.length}`);

  const categories = new Set(WELLNESS_MESSAGES.map((m) => m.category));
  const expectedCategories: WellnessCategory[] = ['hydration', 'self-care', 'rest', 'confidence', 'habits', 'emotional'];
  expectedCategories.forEach((cat) => {
    assert.ok(categories.has(cat), `Missing category: ${cat}`);
    const count = WELLNESS_MESSAGES.filter((m) => m.category === cat).length;
    assert.ok(count >= 4, `Category ${cat} should have multiple messages, found ${count}`);
  });

  // Verify all templates contain {name}
  WELLNESS_MESSAGES.forEach((m) => {
    assert.ok(m.template.includes('{name}'), `Template ${m.id} is missing {name} placeholder: ${m.template}`);
  });
});

test('2. Personalization replaces {name} with user name or falls back to "beautiful"', () => {
  const template = 'Keep your water bottle close today, {name}—every refreshing sip replenishes your natural vitality.';

  // With a user name
  const personalized = formatDailyGreetingMessage(template, 'Elena');
  assert.equal(personalized, 'Keep your water bottle close today, Elena—every refreshing sip replenishes your natural vitality.');

  // With undefined / null / empty / whitespace name -> falls back to "beautiful"
  const fallbackUndefined = formatDailyGreetingMessage(template, undefined);
  assert.equal(fallbackUndefined, 'Keep your water bottle close today, beautiful—every refreshing sip replenishes your natural vitality.');

  const fallbackEmpty = formatDailyGreetingMessage(template, '   ');
  assert.equal(fallbackEmpty, 'Keep your water bottle close today, beautiful—every refreshing sip replenishes your natural vitality.');
});

test('3. Deterministic selection is consistent across refreshes and multiple calls for the same day', () => {
  const userId = 'user_abc123';
  const today = '2026-10-28';

  const firstCall = getDailyGreetingIndex(userId, today, WELLNESS_MESSAGES.length);

  // Simulating 10 successive page refreshes on the same day
  for (let i = 0; i < 10; i++) {
    const nextCall = getDailyGreetingIndex(userId, today, WELLNESS_MESSAGES.length);
    assert.equal(nextCall, firstCall, `Call ${i} did not match first call result`);
  }

  // Full greeting object should also be strictly identical
  const greeting1 = getDailyWellnessGreeting({ userId, userName: 'Elena', dateStr: today, hour: 9 });
  const greeting2 = getDailyWellnessGreeting({ userId, userName: 'Elena', dateStr: today, hour: 9 });

  assert.equal(greeting1.heading, 'Good morning, Elena!');
  assert.equal(greeting1.subtitle, greeting2.subtitle);
  assert.equal(greeting1.messageId, greeting2.messageId);
});

test('4. Day changes automatically advance to a different daily message', () => {
  const userId = 'user_steady';
  const day1 = '2026-10-28';
  const day2 = '2026-10-29';
  const day3 = '2026-10-30';

  const idx1 = getDailyGreetingIndex(userId, day1, WELLNESS_MESSAGES.length);
  const idx2 = getDailyGreetingIndex(userId, day2, WELLNESS_MESSAGES.length);
  const idx3 = getDailyGreetingIndex(userId, day3, WELLNESS_MESSAGES.length);

  // Should not be stuck on the exact same index day over day
  const distinctDays = new Set([idx1, idx2, idx3]);
  assert.ok(distinctDays.size >= 2, 'Consecutive days should select different messages');
});

test('5. Greeting heading replaces "Good morning, beautiful." with "Good morning, {userName}!"', () => {
  // When user has provided name
  const withName = getDailyWellnessGreeting({
    userId: 'u1',
    userName: 'Sophia',
    dateStr: '2026-10-28',
    hour: 8,
  });
  assert.equal(withName.heading, 'Good morning, Sophia!');
  assert.ok(withName.subtitle.includes('Sophia'));

  // When user has not provided name (falls back to "Good morning, beautiful.")
  const fallback = getDailyWellnessGreeting({
    userId: 'u1',
    userName: '',
    dateStr: '2026-10-28',
    hour: 8,
  });
  assert.equal(fallback.heading, 'Good morning, beautiful.');
  assert.ok(fallback.subtitle.includes('beautiful'));
});

test('6. Name changes update greeting heading and subtitle smoothly while keeping the day message ID', () => {
  const userId = 'user_fixed';
  const dateStr = '2026-10-28';

  const greetingInitial = getDailyWellnessGreeting({
    userId,
    userName: 'Maya',
    dateStr,
    hour: 10,
  });

  const greetingUpdated = getDailyWellnessGreeting({
    userId,
    userName: 'Isabella',
    dateStr,
    hour: 10,
  });

  // The underlying chosen daily message index / messageId is identical because userId and date are constant
  assert.equal(greetingInitial.messageId, greetingUpdated.messageId);

  // The text naturally personalized to the new name
  assert.equal(greetingInitial.heading, 'Good morning, Maya!');
  assert.equal(greetingUpdated.heading, 'Good morning, Isabella!');
  assert.ok(greetingInitial.subtitle.includes('Maya'));
  assert.ok(greetingUpdated.subtitle.includes('Isabella'));
});
