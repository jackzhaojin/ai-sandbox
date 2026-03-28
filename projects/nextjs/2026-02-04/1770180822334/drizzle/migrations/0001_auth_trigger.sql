-- Create a function to handle new user signups
-- This function will automatically create a profile when a user signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'editor', -- Default role is 'editor' (can be changed to 'viewer' or 'admin')
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Create a trigger that calls the function when a new user is created in auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Note: This trigger will automatically create a profile record whenever a user
-- signs up through Supabase Auth. The profile will have:
-- - id: Same as the auth.users id
-- - email: From auth.users
-- - name: From user metadata (provided during signup) or derived from email
-- - role: Default to 'editor'
-- - avatar_url: From user metadata if provided
