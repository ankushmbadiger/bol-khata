/*
# Auto-create profile on signup

Adds a trigger that inserts a default profile row whenever a new auth.users row
is created, so the shopkeeper has a profile ready after registration.
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, shop_name, owner_name, phone)
  VALUES (NEW.id, 'My Shop', NULL, NULL)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();
