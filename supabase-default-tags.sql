-- Add default tags for new users
-- This will be triggered when a user signs up

CREATE OR REPLACE FUNCTION create_default_tags_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default tags for the new user
  INSERT INTO tag_colors (user_id, tag_name, background_color, border_color, text_color)
  VALUES
    (NEW.id, 'Important', 'bg-red-900/50', 'border-red-500/40', 'text-red-300'),
    (NEW.id, 'To Do Research On', 'bg-yellow-900/50', 'border-yellow-500/40', 'text-yellow-300'),
    (NEW.id, 'Learning', 'bg-blue-900/50', 'border-blue-500/40', 'text-blue-300'),
    (NEW.id, 'AI', 'bg-purple-900/50', 'border-purple-500/40', 'text-purple-300'),
    (NEW.id, 'Investing', 'bg-green-900/50', 'border-green-500/40', 'text-green-300'),
    (NEW.id, 'Work', 'bg-orange-900/50', 'border-orange-500/40', 'text-orange-300'),
    (NEW.id, 'Personal', 'bg-pink-900/50', 'border-pink-500/40', 'text-pink-300'),
    (NEW.id, 'Ideas', 'bg-teal-900/50', 'border-teal-500/40', 'text-teal-300')
  ON CONFLICT (user_id, tag_name) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_tags_for_user();
