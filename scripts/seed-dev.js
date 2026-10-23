/**
 * OPTIONAL DEVELOPMENT SEED SCRIPT
 *
 * This script is strictly for local development and testing.
 * It NEVER runs automatically and NEVER runs in production.
 *
 * Usage:
 *   node scripts/seed-dev.js --user-id=<your-supabase-user-uuid>
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

const args = process.argv.slice(2);
const userIdArg = args.find((a) => a.startsWith('--user-id='));

if (!userIdArg) {
  console.error('Error: Please provide a user ID: node scripts/seed-dev.js --user-id=<uuid>');
  process.exit(1);
}

const userId = userIdArg.split('=')[1];

if (!userId || userId === '00000000-0000-0000-0000-000000000000') {
  console.error('Error: Please provide a valid, real Supabase auth user UUID (not dummy zeros).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
  console.log(`Seeding optional dev sample data for user: ${userId}...`);

  // Sample Hobbies
  const { error: hobbyErr } = await supabase.from('hobbies').upsert([
    {
      user_id: userId,
      title: 'Drawing',
      description: 'Digital sketching, character designs, ink illustrations',
      icon: 'brush',
      color: '#FFE600',
      mini_projects: ['Draw 10 hands in different gestures', 'Design a retro arcade mascot'],
      creative_challenges: ['Draw a random object on your desk in 60s without lifting pen'],
      total_minutes_logged: 60,
      is_active: true,
    },
    {
      user_id: userId,
      title: 'Music',
      description: 'Beatmaking, synth chords, basslines',
      icon: 'musical-notes',
      color: '#B388FF',
      mini_projects: ['Craft a crunchy lo-fi hip-hop drum loop'],
      creative_challenges: ['Cook up a 4-bar chord progression'],
      total_minutes_logged: 45,
      is_active: true,
    },
  ]);

  if (hobbyErr) console.warn('Hobby seed note:', hobbyErr.message);

  // Sample Streak
  const { error: streakErr } = await supabase.from('streaks').upsert([
    {
      user_id: userId,
      habit_name: 'Doomscrolling Shorts/Reels',
      category: 'Digital',
      started_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      longest_streak_days: 7,
      icon: 'phone-portrait',
      accent_color: '#FF5388',
    },
  ]);

  if (streakErr) console.warn('Streak seed note:', streakErr.message);

  console.log('✓ Dev seed finished.');
}

seed().catch(console.error);
