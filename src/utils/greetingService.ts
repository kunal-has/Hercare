import { todayStr } from '../hooks/useLocalStorage.ts';

export type WellnessCategory =
  | 'hydration'
  | 'self-care'
  | 'rest'
  | 'confidence'
  | 'habits'
  | 'emotional';

export interface WellnessGreetingMessage {
  id: string;
  category: WellnessCategory;
  template: string;
}

export const WELLNESS_MESSAGES: WellnessGreetingMessage[] = [
  // Hydration
  {
    id: 'hydr-1',
    category: 'hydration',
    template: 'Keep your water bottle close today, {name}—every refreshing sip replenishes your natural vitality.',
  },
  {
    id: 'hydr-2',
    category: 'hydration',
    template: 'Hydration is your superpower today, {name}—nourish your body one mindful glass at a time.',
  },
  {
    id: 'hydr-3',
    category: 'hydration',
    template: 'Start with a cool glass of water, {name}, and let your body feel refreshed and replenished.',
  },
  {
    id: 'hydr-4',
    category: 'hydration',
    template: 'A little extra hydration goes a long way today, {name}. Drink in the care your body deserves.',
  },
  {
    id: 'hydr-5',
    category: 'hydration',
    template: 'Sip slowly and stay hydrated today, {name}. Your skin, mind, and energy will thank you.',
  },
  {
    id: 'hydr-6',
    category: 'hydration',
    template: 'Prioritize your hydration today, {name}—it is the simplest, kindest gift you can give yourself.',
  },

  // Self-Care
  {
    id: 'care-1',
    category: 'self-care',
    template: 'Take a quiet moment just for you today, {name}. You deserve the same tenderness you offer others.',
  },
  {
    id: 'care-2',
    category: 'self-care',
    template: 'Self-care isn’t a luxury, {name}—it is how you tenderly protect your peace and energy.',
  },
  {
    id: 'care-3',
    category: 'self-care',
    template: 'Protect your peaceful energy today, {name}. Say yes to what nourishes you and no to what drains you.',
  },
  {
    id: 'care-4',
    category: 'self-care',
    template: 'Breathe in ease, exhale any pressure, {name}. Today is a day to move at your own gentle pace.',
  },
  {
    id: 'care-5',
    category: 'self-care',
    template: 'Carve out ten quiet minutes today, {name}. Your inner calm is your most precious sanctuary.',
  },
  {
    id: 'care-6',
    category: 'self-care',
    template: 'Give yourself grace today, {name}. You do not have to carry the weight of everything at once.',
  },

  // Rest & Recovery
  {
    id: 'rest-1',
    category: 'rest',
    template: 'Rest isn’t a reward you have to earn, {name}. Give yourself permission to pause and recharge.',
  },
  {
    id: 'rest-2',
    category: 'rest',
    template: 'Listen to the quiet whispers of your body, {name}. If you feel tired, honor it with gentle rest.',
  },
  {
    id: 'rest-3',
    category: 'rest',
    template: 'A restful evening begins with mindful choices today, {name}. Prepare your space for peaceful dreams.',
  },
  {
    id: 'rest-4',
    category: 'rest',
    template: 'Slow down your thoughts, {name}. Recharging your spirit is just as productive as finishing tasks.',
  },
  {
    id: 'rest-5',
    category: 'rest',
    template: 'Release the tension in your jaw and shoulders, {name}. Give yourself room to simply breathe.',
  },
  {
    id: 'rest-6',
    category: 'rest',
    template: 'Rest and stillness are where your resilience is rebuilt, {name}. Take things one gentle breath at a time.',
  },

  // Confidence & Self-Worth
  {
    id: 'conf-1',
    category: 'confidence',
    template: 'Trust in your unique strength and beauty today, {name}. You are capable of amazing things.',
  },
  {
    id: 'conf-2',
    category: 'confidence',
    template: 'Walk through today with gentle confidence, {name}. Your voice, presence, and heart truly matter.',
  },
  {
    id: 'conf-3',
    category: 'confidence',
    template: 'Celebrate how far you have come, {name}. Every small step forward is a victory to be proud of.',
  },
  {
    id: 'conf-4',
    category: 'confidence',
    template: 'You don’t need anyone’s permission to shine brightly today, {name}. Own your worth unapologetically.',
  },
  {
    id: 'conf-5',
    category: 'confidence',
    template: 'Stand tall in your truth today, {name}. You carry quiet grace and resilience in everything you do.',
  },
  {
    id: 'conf-6',
    category: 'confidence',
    template: 'Believe in your natural wisdom today, {name}. You know your body and your heart better than anyone.',
  },

  // Healthy Habits & Body Wisdom
  {
    id: 'hab-1',
    category: 'habits',
    template: 'Small, consistent acts of wellness create lifelong vitality, {name}. Celebrate each mindful choice.',
  },
  {
    id: 'hab-2',
    category: 'habits',
    template: 'Nourish your body with wholesome foods today, {name}, and feel the vibrant energy it gives you back.',
  },
  {
    id: 'hab-3',
    category: 'habits',
    template: 'Honor the natural rhythm of your cycle today, {name}. Your body’s seasons are full of deep wisdom.',
  },
  {
    id: 'hab-4',
    category: 'habits',
    template: 'Gentle movement and nourishing meals are your allies today, {name}. Tune in to what feels right.',
  },
  {
    id: 'hab-5',
    category: 'habits',
    template: 'Every healthy habit you cultivate, {name}, is an investment in the happy, vibrant life you deserve.',
  },
  {
    id: 'hab-6',
    category: 'habits',
    template: 'Remember your wellness routine today, {name}—consistency is love made visible in daily habits.',
  },

  // Emotional Well-being
  {
    id: 'emo-1',
    category: 'emotional',
    template: 'Honor every emotion that visits you today, {name}. All of your feelings are valid and temporary.',
  },
  {
    id: 'emo-2',
    category: 'emotional',
    template: 'Speak to your heart with tenderness today, {name}. You are doing so much better than you realize.',
  },
  {
    id: 'emo-3',
    category: 'emotional',
    template: 'Surround yourself with warmth and uplifting energy today, {name}. You deserve unconditional peace.',
  },
  {
    id: 'emo-4',
    category: 'emotional',
    template: 'Let go of what you cannot control today, {name}, and embrace the quiet beauty of this present moment.',
  },
  {
    id: 'emo-5',
    category: 'emotional',
    template: 'Be patient with your heart today, {name}. Healing, growing, and thriving take time and gentle patience.',
  },
  {
    id: 'emo-6',
    category: 'emotional',
    template: 'Choose joy in the small things today, {name}. A warm tea, a kind word, and a grateful heart.',
  },
];

/**
 * Deterministic hash function combining userId and local date string (YYYY-MM-DD).
 * Guarantees consistent message for the same user on the same calendar day,
 * and seamlessly rotates to a new message on the next day.
 */
export function getDailyGreetingIndex(userId: string, dateStr: string, totalCount: number): number {
  if (totalCount <= 0) return 0;
  const combined = `${userId.trim().toLowerCase()}::${dateStr.trim()}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash) % totalCount;
}

/**
 * Injects user's name into the message template, falling back naturally to "beautiful".
 */
export function formatDailyGreetingMessage(template: string, name?: string): string {
  const cleanName = name?.trim();
  const displayName = cleanName || 'beautiful';
  return template.replace(/\{name\}/g, displayName);
}

export interface DailyGreetingDetails {
  heading: string;
  subtitle: string;
  messageId: string;
  category: WellnessCategory;
  displayName: string;
  isFallbackName: boolean;
  timeGreeting: string;
}

/**
 * Main generator for the personalized daily greeting & subtitle.
 */
export function getDailyWellnessGreeting(options: {
  userId?: string;
  userName?: string;
  dateStr?: string;
  hour?: number;
}): DailyGreetingDetails {
  const userId = options.userId?.trim() || 'hercare_user_default';
  const dateStr = options.dateStr?.trim() || todayStr();
  const cleanName = options.userName?.trim();
  const isFallbackName = !cleanName;
  const displayName = cleanName || 'beautiful';

  const hour = options.hour !== undefined ? options.hour : new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Heading: "Good morning, Elena!" or "Good morning, beautiful."
  const heading = isFallbackName ? `${timeGreeting}, beautiful.` : `${timeGreeting}, ${cleanName}!`;

  const index = getDailyGreetingIndex(userId, dateStr, WELLNESS_MESSAGES.length);
  const selected = WELLNESS_MESSAGES[index];
  const subtitle = formatDailyGreetingMessage(selected.template, cleanName);

  return {
    heading,
    subtitle,
    messageId: selected.id,
    category: selected.category,
    displayName,
    isFallbackName,
    timeGreeting,
  };
}
