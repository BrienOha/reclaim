export interface Quote {
  id: string;
  text: string;
  author: string;
  category: 'recovery' | 'creation' | 'focus';
}

export const MOTIVATIONAL_QUOTES: Quote[] = [
  {
    id: 'q-1',
    text: "You don't need willpower to stop an addiction; you need a love for something greater.",
    author: 'James Clear',
    category: 'recovery',
  },
  {
    id: 'q-2',
    text: 'Every second you spend resisting an impulse is a deposit into your future self-mastery.',
    author: 'Marcus Aurelius',
    category: 'focus',
  },
  {
    id: 'q-3',
    text: 'Action is not just the effect of motivation; it is also the cause of it.',
    author: 'Mark Manson',
    category: 'creation',
  },
  {
    id: 'q-4',
    text: 'Replace consumption with creation. Consume less, produce more.',
    author: 'Austin Kleon',
    category: 'creation',
  },
  {
    id: 'q-5',
    text: 'A relapse or stumble is just information, not an identity. Reset, learn the trigger, and keep moving.',
    author: 'Recovery Wisdom',
    category: 'recovery',
  },
  {
    id: 'q-6',
    text: 'Creativity is intelligence having fun.',
    author: 'Albert Einstein',
    category: 'creation',
  },
];

export function getRandomQuote(): Quote {
  const index = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
  return MOTIVATIONAL_QUOTES[index];
}
