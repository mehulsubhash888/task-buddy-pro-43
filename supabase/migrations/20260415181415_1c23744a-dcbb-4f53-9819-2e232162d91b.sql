
-- Create offices table
CREATE TABLE public.offices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  manager_username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create office_members table
CREATE TABLE public.office_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(office_id, username)
);

-- Create assigned_tasks table
CREATE TABLE public.assigned_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  assigned_to TEXT NOT NULL,
  assigned_by TEXT NOT NULL,
  description TEXT NOT NULL,
  resources TEXT DEFAULT '',
  assigned_date TEXT NOT NULL,
  target_date TEXT NOT NULL,
  completed_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assigned_tasks ENABLE ROW LEVEL SECURITY;

-- Open policies (no Supabase Auth used, local auth only)
CREATE POLICY "Allow all access to offices" ON public.offices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to office_members" ON public.office_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to assigned_tasks" ON public.assigned_tasks FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.office_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assigned_tasks;
