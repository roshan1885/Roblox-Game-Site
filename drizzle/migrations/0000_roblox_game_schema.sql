-- ========== ENUMS ==========
CREATE TYPE public.app_role AS ENUM ('system','owner','co_owner','custom_role','application_reader','public');
CREATE TYPE public.app_permission AS ENUM (
  'CAN_POST_ANNOUNCEMENTS','CAN_POST_NOTICES','CAN_ASSIGN_TASKS','CAN_MANAGE_USERS','CAN_MANAGE_ROLES',
  'CAN_VIEW_APPLICATIONS','CAN_MANAGE_APPLICATIONS','CAN_MANAGE_SOCIALS','CAN_CREATE_FORMS','ADMINISTRATOR');
CREATE TYPE public.application_status AS ENUM ('PENDING','UNDER_REVIEW','ACCEPTED','REJECTED');
CREATE TYPE public.task_status AS ENUM ('PENDING','IN_PROGRESS','COMPLETED','CANCELLED');
CREATE TYPE public.task_priority AS ENUM ('LOW','MEDIUM','HIGH','URGENT');
CREATE TYPE public.form_field_type AS ENUM ('TEXT','TEXTAREA','EMAIL','NUMBER','SELECT','CHECKBOX','RADIO','DATE');

-- ========== updated_at helper ==========
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  username text UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (username) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ========== USER ROLES (one base role per user) ==========
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'public',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ========== CUSTOM ROLES ==========
CREATE TABLE public.custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  permissions public.app_permission[] NOT NULL DEFAULT '{}',
  is_recruitable boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.custom_roles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_roles TO authenticated;
GRANT ALL ON public.custom_roles TO service_role;
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER custom_roles_touch BEFORE UPDATE ON public.custom_roles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.user_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role_id uuid NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  assigned_by uuid,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role_id)
);
CREATE INDEX ON public.user_role_assignments(user_id);
GRANT SELECT, INSERT, DELETE ON public.user_role_assignments TO authenticated;
GRANT ALL ON public.user_role_assignments TO service_role;
ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;

-- ========== ACCESS FUNCTIONS ==========
CREATE OR REPLACE FUNCTION public.role_level(_role public.app_role)
RETURNS int LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _role
    WHEN 'system' THEN 100 WHEN 'owner' THEN 80 WHEN 'co_owner' THEN 70
    WHEN 'custom_role' THEN 50 WHEN 'application_reader' THEN 40 ELSE 10 END
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT role FROM public.user_roles WHERE user_id = _user_id), 'public'::public.app_role)
$$;

CREATE OR REPLACE FUNCTION public.role_default_permissions(_role public.app_role)
RETURNS public.app_permission[] LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN _role IN ('system','owner') THEN ARRAY['ADMINISTRATOR','CAN_POST_ANNOUNCEMENTS','CAN_POST_NOTICES','CAN_ASSIGN_TASKS','CAN_MANAGE_USERS','CAN_MANAGE_ROLES','CAN_VIEW_APPLICATIONS','CAN_MANAGE_APPLICATIONS','CAN_MANAGE_SOCIALS','CAN_CREATE_FORMS']::public.app_permission[]
    WHEN _role = 'co_owner' THEN ARRAY['CAN_POST_ANNOUNCEMENTS','CAN_POST_NOTICES','CAN_ASSIGN_TASKS','CAN_VIEW_APPLICATIONS','CAN_MANAGE_APPLICATIONS','CAN_MANAGE_SOCIALS']::public.app_permission[]
    WHEN _role = 'application_reader' THEN ARRAY['CAN_VIEW_APPLICATIONS','CAN_MANAGE_APPLICATIONS']::public.app_permission[]
    ELSE ARRAY[]::public.app_permission[] END
$$;

CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid)
RETURNS public.app_permission[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN COALESCE((SELECT is_active FROM public.profiles WHERE id = _user_id), false) = false
    THEN ARRAY[]::public.app_permission[]
  ELSE ARRAY(
    SELECT DISTINCT p FROM (
      SELECT unnest(public.role_default_permissions(public.get_user_role(_user_id))) AS p
      UNION
      SELECT unnest(cr.permissions) FROM public.user_role_assignments a
        JOIN public.custom_roles cr ON cr.id = a.role_id WHERE a.user_id = _user_id
    ) s ORDER BY p
  ) END
$$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _perm public.app_permission)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT 'ADMINISTRATOR' = ANY(public.get_user_permissions(_user_id))
      OR _perm = ANY(public.get_user_permissions(_user_id))
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT is_active FROM public.profiles WHERE id = _user_id), false)
     AND (public.get_user_role(_user_id) <> 'public'
          OR EXISTS (SELECT 1 FROM public.user_role_assignments WHERE user_id = _user_id))
$$;

CREATE OR REPLACE FUNCTION public.can_manage_role(_actor uuid, _target_role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_permission(_actor, 'CAN_MANAGE_USERS')
     AND (public.get_user_role(_actor) = 'system'
          OR public.role_level(public.get_user_role(_actor)) > public.role_level(_target_role))
$$;

CREATE OR REPLACE FUNCTION public.can_manage_user(_actor uuid, _target uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _actor <> _target AND public.can_manage_role(_actor, public.get_user_role(_target))
$$;

CREATE OR REPLACE FUNCTION public.get_my_access()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'user_id', auth.uid(),
    'username', (SELECT username FROM public.profiles WHERE id = auth.uid()),
    'email', (SELECT email FROM public.profiles WHERE id = auth.uid()),
    'is_active', COALESCE((SELECT is_active FROM public.profiles WHERE id = auth.uid()), false),
    'role', public.get_user_role(auth.uid()),
    'is_staff', public.is_staff(auth.uid()),
    'permissions', to_jsonb(public.get_user_permissions(auth.uid())),
    'custom_roles', COALESCE((SELECT jsonb_agg(cr.name ORDER BY cr.name) FROM public.user_role_assignments a
        JOIN public.custom_roles cr ON cr.id = a.role_id WHERE a.user_id = auth.uid()), '[]'::jsonb)
  )
$$;

-- Role / status changes go through hierarchy-checked RPCs
CREATE OR REPLACE FUNCTION public.set_user_role(_target uuid, _role public.app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.can_manage_user(auth.uid(), _target) OR NOT public.can_manage_role(auth.uid(), _role) THEN
    RAISE EXCEPTION 'You cannot assign this role' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_target, _role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, updated_at = now();
END; $$;

CREATE OR REPLACE FUNCTION public.set_user_active(_target uuid, _active boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.can_manage_user(auth.uid(), _target) THEN
    RAISE EXCEPTION 'You cannot manage this user' USING ERRCODE = '42501';
  END IF;
  UPDATE public.profiles SET is_active = _active WHERE id = _target;
END; $$;

-- ========== NEW USER TRIGGERS ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _username text := NULLIF(trim(NEW.raw_user_meta_data->>'username'), '');
BEGIN
  IF _username IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE username = _username) THEN
    _username := NULL;
  END IF;
  INSERT INTO public.profiles (id, email, username) VALUES (NEW.id, NEW.email, _username)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'public') ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.handle_user_confirmed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE TRIGGER on_auth_user_updated AFTER UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_user_confirmed();

-- ========== APPLICATION FORMS ==========
CREATE TABLE public.application_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL UNIQUE REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.application_forms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.application_forms TO authenticated;
GRANT ALL ON public.application_forms TO service_role;
ALTER TABLE public.application_forms ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER application_forms_touch BEFORE UPDATE ON public.application_forms FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.application_forms(id) ON DELETE CASCADE,
  label text NOT NULL,
  type public.form_field_type NOT NULL DEFAULT 'TEXT',
  required boolean NOT NULL DEFAULT true,
  options text[] NOT NULL DEFAULT '{}',
  placeholder text,
  sort_order int NOT NULL DEFAULT 0
);
CREATE INDEX ON public.form_fields(form_id);
GRANT SELECT ON public.form_fields TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_fields TO authenticated;
GRANT ALL ON public.form_fields TO service_role;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  form_id uuid NOT NULL REFERENCES public.application_forms(id) ON DELETE CASCADE,
  status public.application_status NOT NULL DEFAULT 'PENDING',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  notes text
);
CREATE INDEX ON public.applications(user_id);
CREATE INDEX ON public.applications(form_id);
CREATE INDEX ON public.applications(status);
GRANT SELECT, UPDATE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.form_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES public.form_fields(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  value text NOT NULL DEFAULT '',
  UNIQUE (application_id, field_id)
);
GRANT SELECT ON public.form_responses TO authenticated;
GRANT ALL ON public.form_responses TO service_role;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.submit_application(_form_id uuid, _responses jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _app_id uuid; f record; _val text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to apply' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.application_forms WHERE id = _form_id AND is_active) THEN
    RAISE EXCEPTION 'This application is not open';
  END IF;
  IF EXISTS (SELECT 1 FROM public.applications WHERE user_id = auth.uid() AND form_id = _form_id AND status IN ('PENDING','UNDER_REVIEW')) THEN
    RAISE EXCEPTION 'You already have an open application for this role';
  END IF;
  INSERT INTO public.applications (user_id, form_id) VALUES (auth.uid(), _form_id) RETURNING id INTO _app_id;
  FOR f IN SELECT * FROM public.form_fields WHERE form_id = _form_id LOOP
    _val := left(COALESCE(_responses->>(f.id::text), ''), 5000);
    IF f.required AND trim(_val) = '' THEN
      RAISE EXCEPTION 'Please answer: %', f.label;
    END IF;
    INSERT INTO public.form_responses (application_id, field_id, user_id, value) VALUES (_app_id, f.id, auth.uid(), _val);
  END LOOP;
  RETURN _app_id;
END; $$;

-- ========== TASKS ==========
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status public.task_status NOT NULL DEFAULT 'PENDING',
  priority public.task_priority NOT NULL DEFAULT 'MEDIUM',
  assigned_to uuid,
  created_by uuid,
  due_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.tasks(assigned_to);
CREATE INDEX ON public.tasks(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER tasks_touch BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ========== ANNOUNCEMENTS & NOTICES ==========
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  author_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER announcements_touch BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notices TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notices TO authenticated;
GRANT ALL ON public.notices TO service_role;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER notices_touch BEFORE UPDATE ON public.notices FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ========== GAME INFO & SETTINGS & SOCIALS ==========
CREATE TABLE public.game_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  game_url text,
  genre text,
  player_count int NOT NULL DEFAULT 0,
  like_count int NOT NULL DEFAULT 0,
  dislike_count int NOT NULL DEFAULT 0,
  favorite_count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.game_info TO anon, authenticated;
GRANT UPDATE ON public.game_info TO authenticated;
GRANT ALL ON public.game_info TO service_role;
ALTER TABLE public.game_info ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text NOT NULL DEFAULT 'Pet Smugglers',
  site_description text,
  maintenance_mode boolean NOT NULL DEFAULT false,
  registration_open boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  url text NOT NULL,
  label text,
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.social_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_links TO authenticated;
GRANT ALL ON public.social_links TO service_role;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- ========== ROW LEVEL SECURITY POLICIES ==========
CREATE POLICY "Public profiles are readable" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own username" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Staff manage user active state" ON public.profiles FOR UPDATE TO authenticated USING (public.has_permission(auth.uid(), 'CAN_MANAGE_USERS'));

CREATE POLICY "Roles are readable by authenticated" ON public.user_roles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Custom roles are public" ON public.custom_roles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Role managers insert roles" ON public.custom_roles FOR INSERT TO authenticated WITH CHECK (public.has_permission(auth.uid(), 'CAN_MANAGE_ROLES'));
CREATE POLICY "Role managers update roles" ON public.custom_roles FOR UPDATE TO authenticated USING (public.has_permission(auth.uid(), 'CAN_MANAGE_ROLES')) WITH CHECK (public.has_permission(auth.uid(), 'CAN_MANAGE_ROLES'));
CREATE POLICY "Role managers delete roles" ON public.custom_roles FOR DELETE TO authenticated USING (public.has_permission(auth.uid(), 'CAN_MANAGE_ROLES'));

CREATE POLICY "Role assignments are readable" ON public.user_role_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Role managers assign roles" ON public.user_role_assignments FOR INSERT TO authenticated WITH CHECK (public.has_permission(auth.uid(), 'CAN_MANAGE_ROLES'));
CREATE POLICY "Role managers remove roles" ON public.user_role_assignments FOR DELETE TO authenticated USING (public.has_permission(auth.uid(), 'CAN_MANAGE_ROLES'));

CREATE POLICY "Active forms are public" ON public.application_forms FOR SELECT TO anon, authenticated USING (is_active OR public.has_permission(auth.uid(), 'CAN_VIEW_APPLICATIONS'));
CREATE POLICY "Form creators manage forms" ON public.application_forms FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'CAN_CREATE_FORMS')) WITH CHECK (public.has_permission(auth.uid(), 'CAN_CREATE_FORMS'));

CREATE POLICY "Form fields are readable" ON public.form_fields FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Form creators manage fields" ON public.form_fields FOR ALL TO authenticated USING (public.has_permission(auth.uid(), 'CAN_CREATE_FORMS')) WITH CHECK (public.has_permission(auth.uid(), 'CAN_CREATE_FORMS'));

CREATE POLICY "Users read own applications" ON public.applications FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_permission(auth.uid(), 'CAN_VIEW_APPLICATIONS'));
CREATE POLICY "Reviewers update applications" ON public.applications FOR UPDATE TO authenticated USING (public.has_permission(auth.uid(), 'CAN_MANAGE_APPLICATIONS')) WITH CHECK (public.has_permission(auth.uid(), 'CAN_MANAGE_APPLICATIONS'));

CREATE POLICY "Users and reviewers read responses" ON public.form_responses FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_permission(auth.uid(), 'CAN_VIEW_APPLICATIONS'));

CREATE POLICY "Staff read tasks" ON public.tasks FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Task assigners insert" ON public.tasks FOR INSERT TO authenticated WITH CHECK (public.has_permission(auth.uid(), 'CAN_ASSIGN_TASKS'));
CREATE POLICY "Task assigners or assignee update" ON public.tasks FOR UPDATE TO authenticated USING (assigned_to = auth.uid() OR public.has_permission(auth.uid(), 'CAN_ASSIGN_TASKS')) WITH CHECK (assigned_to = auth.uid() OR public.has_permission(auth.uid(), 'CAN_ASSIGN_TASKS'));
CREATE POLICY "Task assigners delete" ON public.tasks FOR DELETE TO authenticated USING (public.has_permission(auth.uid(), 'CAN_ASSIGN_TASKS'));

CREATE POLICY "Announcements are public" ON public.announcements FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Announcement managers insert" ON public.announcements FOR INSERT TO authenticated WITH CHECK (public.has_permission(auth.uid(), 'CAN_POST_ANNOUNCEMENTS'));
CREATE POLICY "Announcement managers update" ON public.announcements FOR UPDATE TO authenticated USING (public.has_permission(auth.uid(), 'CAN_POST_ANNOUNCEMENTS')) WITH CHECK (public.has_permission(auth.uid(), 'CAN_POST_ANNOUNCEMENTS'));
CREATE POLICY "Announcement managers delete" ON public.announcements FOR DELETE TO authenticated USING (public.has_permission(auth.uid(), 'CAN_POST_ANNOUNCEMENTS'));

CREATE POLICY "Notices are public" ON public.notices FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Notice managers insert" ON public.notices FOR INSERT TO authenticated WITH CHECK (public.has_permission(auth.uid(), 'CAN_POST_NOTICES'));
CREATE POLICY "Notice managers update" ON public.notices FOR UPDATE TO authenticated USING (public.has_permission(auth.uid(), 'CAN_POST_NOTICES')) WITH CHECK (public.has_permission(auth.uid(), 'CAN_POST_NOTICES'));
CREATE POLICY "Notice managers delete" ON public.notices FOR DELETE TO authenticated USING (public.has_permission(auth.uid(), 'CAN_POST_NOTICES'));

CREATE POLICY "Active socials are public" ON public.social_links FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "Social managers read all" ON public.social_links FOR SELECT TO authenticated USING (public.has_permission(auth.uid(), 'CAN_MANAGE_SOCIALS'));
CREATE POLICY "Social managers insert" ON public.social_links FOR INSERT TO authenticated WITH CHECK (public.has_permission(auth.uid(), 'CAN_MANAGE_SOCIALS'));
CREATE POLICY "Social managers update" ON public.social_links FOR UPDATE TO authenticated USING (public.has_permission(auth.uid(), 'CAN_MANAGE_SOCIALS')) WITH CHECK (public.has_permission(auth.uid(), 'CAN_MANAGE_SOCIALS'));
CREATE POLICY "Social managers delete" ON public.social_links FOR DELETE TO authenticated USING (public.has_permission(auth.uid(), 'CAN_MANAGE_SOCIALS'));

CREATE POLICY "Game info is public" ON public.game_info FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins update game info" ON public.game_info FOR UPDATE TO authenticated USING (public.has_permission(auth.uid(), 'ADMINISTRATOR')) WITH CHECK (public.has_permission(auth.uid(), 'ADMINISTRATOR'));
CREATE POLICY "Site settings are public" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins update site settings" ON public.site_settings FOR UPDATE TO authenticated USING (public.has_permission(auth.uid(), 'ADMINISTRATOR')) WITH CHECK (public.has_permission(auth.uid(), 'ADMINISTRATOR'));

-- ========== RPC GRANTS ==========
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_user_confirmed() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, public.app_permission) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_user(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_active(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_application(uuid, jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.set_user_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_user_active(uuid, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.submit_application(uuid, jsonb) FROM anon;

-- Add missing columns to announcements
ALTER TABLE public.announcements 
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS author_name text;

-- Add missing columns to notices
ALTER TABLE public.notices 
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS author_name text;

-- Add missing thumbnail to game_info
ALTER TABLE public.game_info 
  ADD COLUMN IF NOT EXISTS thumbnail text;

-- Ensure author triggers are active to populate author_name automatically
CREATE OR REPLACE FUNCTION public.set_author_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.author_id IS NULL THEN NEW.author_id := auth.uid(); END IF;
  END IF;
  NEW.author_name := COALESCE((SELECT username FROM public.profiles WHERE id = NEW.author_id), 'Staff');
  IF TG_OP = 'UPDATE' THEN NEW.updated_at := now(); END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS announcements_author ON public.announcements;
CREATE TRIGGER announcements_author BEFORE INSERT OR UPDATE ON public.announcements 
FOR EACH ROW EXECUTE FUNCTION public.set_author_fields();

DROP TRIGGER IF EXISTS notices_author ON public.notices;
CREATE TRIGGER notices_author BEFORE INSERT OR UPDATE ON public.notices 
FOR EACH ROW EXECUTE FUNCTION public.set_author_fields();


-- ========== INITIAL RECORDS ==========
INSERT INTO public.game_info (title, description, game_url, genre, updated_at) VALUES
 ('Pet Smugglers', 'Welcome to Pet Smugglers! A Roblox game where you smuggle pets and build your collection.', 'https://www.roblox.com/games/140670513937403/Pets-Smugglers', 'Adventure', to_timestamp(1794770087.598));
INSERT INTO public.site_settings (site_name, site_description, maintenance_mode, registration_open, updated_at) VALUES
 ('Pet Smugglers', 'Official website for Pet Smugglers Roblox game', false, true, to_timestamp(1794770087.604));
INSERT INTO public.social_links (platform, url, label, icon, sort_order, created_by) VALUES
 ('Roblox', 'https://www.roblox.com/games/140670513937403/Pets-Smugglers', 'Play on Roblox', 'gamepad', 0, NULL);
