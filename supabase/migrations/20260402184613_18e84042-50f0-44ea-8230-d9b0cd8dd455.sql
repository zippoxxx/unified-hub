
-- ============================================
-- 1. ENUM TYPES
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.channel_type AS ENUM ('direct', 'group');
CREATE TYPE public.meeting_status AS ENUM ('scheduled', 'in_progress', 'finished');
CREATE TYPE public.meeting_room_type AS ENUM ('virtual', 'presential');

-- ============================================
-- 2. PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  extension TEXT,
  department TEXT,
  is_online BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. USER ROLES TABLE
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. SECURITY DEFINER FUNCTION (has_role)
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============================================
-- 5. USER PERMISSIONS TABLE
-- ============================================
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_chats BOOLEAN NOT NULL DEFAULT true,
  module_contacts BOOLEAN NOT NULL DEFAULT true,
  module_calls BOOLEAN NOT NULL DEFAULT true,
  module_meetings BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. CHANNELS TABLE (groups / direct messages)
-- ============================================
CREATE TABLE public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  type channel_type NOT NULL DEFAULT 'direct',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. CHANNEL MEMBERS TABLE
-- ============================================
CREATE TABLE public.channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. MESSAGES TABLE
-- ============================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. MEETINGS TABLE
-- ============================================
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  meeting_code TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 10),
  password TEXT NOT NULL,
  room_type meeting_room_type NOT NULL DEFAULT 'virtual',
  status meeting_status NOT NULL DEFAULT 'scheduled',
  recurrence TEXT,
  scheduled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 10. MEETING PARTICIPANTS TABLE
-- ============================================
CREATE TABLE public.meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ,
  UNIQUE(meeting_id, user_id)
);
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 11. BROADCASTS TABLE
-- ============================================
CREATE TABLE public.broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 12. UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON public.channels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON public.user_permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 13. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  INSERT INTO public.user_permissions (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 14. RLS POLICIES
-- ============================================

-- Profiles: everyone can read, users update own
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- User roles: admins can manage, users read own
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User permissions: admins manage, users read own
CREATE POLICY "Users read own permissions" ON public.user_permissions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage permissions" ON public.user_permissions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Channels: members can see their channels
CREATE POLICY "Members see channels" ON public.channels FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.channel_members cm WHERE cm.channel_id = id AND cm.user_id = auth.uid()));
CREATE POLICY "Auth users create channels" ON public.channels FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner deletes channel" ON public.channels FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owner updates channel" ON public.channels FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

-- Channel members
CREATE POLICY "Members see members" ON public.channel_members FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.channel_members cm WHERE cm.channel_id = channel_id AND cm.user_id = auth.uid()));
CREATE POLICY "Owner or self add member" ON public.channel_members FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.channels c WHERE c.id = channel_id AND c.owner_id = auth.uid())
  );
CREATE POLICY "Owner removes member" ON public.channel_members FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.channels c WHERE c.id = channel_id AND c.owner_id = auth.uid())
  );

-- Messages: members can read/write
CREATE POLICY "Members read messages" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.channel_members cm WHERE cm.channel_id = channel_id AND cm.user_id = auth.uid()));
CREATE POLICY "Members send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.channel_members cm WHERE cm.channel_id = channel_id AND cm.user_id = auth.uid()));

-- Meetings: authenticated users can see all, creator manages
CREATE POLICY "Auth users view meetings" ON public.meetings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users create meetings" ON public.meetings FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creator updates meeting" ON public.meetings FOR UPDATE TO authenticated USING (auth.uid() = creator_id);
CREATE POLICY "Creator deletes meeting" ON public.meetings FOR DELETE TO authenticated USING (auth.uid() = creator_id);

-- Meeting participants
CREATE POLICY "Auth users view participants" ON public.meeting_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Creator or self add participant" ON public.meeting_participants FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.meetings m WHERE m.id = meeting_id AND m.creator_id = auth.uid())
  );

-- Broadcasts: admins create, all read
CREATE POLICY "All read broadcasts" ON public.broadcasts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins create broadcasts" ON public.broadcasts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- 15. STORAGE BUCKET FOR CHAT FILES
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', true);

CREATE POLICY "Auth users upload chat files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-files');
CREATE POLICY "Anyone can view chat files" ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-files');

-- ============================================
-- 16. ENABLE REALTIME ON MESSAGES AND BROADCASTS
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcasts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
