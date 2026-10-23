-- Seed Data for Reclaim testing
-- Note: Replace '00000000-0000-0000-0000-000000000000' with your actual user uuid after signing up, or run directly in Supabase SQL editor.

do $$
declare
  test_user_id uuid := '00000000-0000-0000-0000-000000000000';
begin
  -- 1. Hobbies
  insert into public.hobbies (user_id, title, description, icon, color, mini_projects, creative_challenges)
  values
    (test_user_id, 'Drawing', 'Digital sketches, character designs, ink illustrations', 'palette', '#FFE600', 
     '["Draw 10 hands in different gestures", "Design a retro arcade cabinet mascot", "One-point perspective cyberpunk room"]'::jsonb,
     '["Draw a random object on your desk in 60 seconds without lifting your pen", "Sketch your current mood as an abstract monster"]'::jsonb),
    (test_user_id, 'Film / Videography', 'Cinematic b-roll, storytelling, camera movements', 'video', '#FF5388', 
     '["Shoot a 15-second moody morning coffee montage", "Experiment with harsh lighting and shadow silhouettes"]'::jsonb,
     '["Record 3 cinematic clips in your room using only practical desk lamps"]'::jsonb),
    (test_user_id, 'Editing', 'Pacing, sound design, rhythmic cuts, color grading', 'scissors', '#38B6FF', 
     '["Edit a punchy 30-sec trailer cut to a heavy beat", "Practice whoosh and foley audio layering"]'::jsonb,
     '["Re-edit an old phone video into a fast-paced neo-noir teaser"]'::jsonb),
    (test_user_id, 'Graphic Design', 'Poster design, brutalist layouts, typography experiments', 'layout', '#FF7A00', 
     '["Create a Swiss-style Bauhaus music poster", "Design a dystopian concert ticket stub"]'::jsonb,
     '["Design an album cover using only 2 colors and 1 chunky font"]'::jsonb),
    (test_user_id, 'Music', 'Beatmaking, synth chords, basslines, melody building', 'music', '#B388FF', 
     '["Craft a crunchy lo-fi hip-hop drum loop", "Program a dark 80s synthwave bassline in minor key"]'::jsonb,
     '["Cook up a 4-bar chord progression using a weird retro electric piano sound"]'::jsonb)
  on conflict do nothing;

  -- 2. Initial Clean Streaks
  insert into public.streaks (user_id, habit_name, category, started_at, longest_streak_days, icon, accent_color)
  values
    (test_user_id, 'Doomscrolling Shorts/Reels', 'Digital', now() - interval '6 days', 14, 'smartphone', '#FF5388'),
    (test_user_id, 'Binge Eating Late Night', 'Behavioral', now() - interval '12 days', 21, 'coffee', '#FFE600'),
    (test_user_id, 'Vaping / Nicotine', 'Substance', now() - interval '30 days', 30, 'shield', '#00E599')
  on conflict do nothing;
end $$;
