-- Create user_tiles table for available tiles in sidebar
CREATE TABLE public.user_tiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tile_id text NOT NULL,
  course_name text NOT NULL,
  section text NOT NULL,
  teacher text NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  duration integer NOT NULL,
  color text NOT NULL,
  split_from_id text,
  original_duration integer,
  subject_type text DEFAULT 'Lec',
  lab_type text,
  is_asynchronous boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create placed_tiles table for tiles on the timetable grid
CREATE TABLE public.placed_tiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tile_id text NOT NULL,
  course_name text NOT NULL,
  section text NOT NULL,
  teacher text NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  duration integer NOT NULL,
  color text NOT NULL,
  day text NOT NULL,
  room text NOT NULL,
  slot_index integer NOT NULL,
  split_from_id text,
  original_duration integer,
  subject_type text DEFAULT 'Lec',
  lab_type text,
  is_asynchronous boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_rooms table for custom room lists
CREATE TABLE public.user_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rooms jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create saved_schedules table for saved schedules
CREATE TABLE public.saved_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_id text NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('teacher', 'section', 'room')),
  tiles jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_tiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placed_tiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_tiles
CREATE POLICY "Users can view their own tiles"
  ON public.user_tiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tiles"
  ON public.user_tiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tiles"
  ON public.user_tiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tiles"
  ON public.user_tiles FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for placed_tiles
CREATE POLICY "Users can view their own placed tiles"
  ON public.placed_tiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own placed tiles"
  ON public.placed_tiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own placed tiles"
  ON public.placed_tiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own placed tiles"
  ON public.placed_tiles FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_rooms
CREATE POLICY "Users can view their own rooms"
  ON public.user_rooms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rooms"
  ON public.user_rooms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rooms"
  ON public.user_rooms FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rooms"
  ON public.user_rooms FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for saved_schedules
CREATE POLICY "Users can view their own schedules"
  ON public.saved_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own schedules"
  ON public.saved_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules"
  ON public.saved_schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules"
  ON public.saved_schedules FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at_user_tiles
  BEFORE UPDATE ON public.user_tiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_placed_tiles
  BEFORE UPDATE ON public.placed_tiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_user_rooms
  BEFORE UPDATE ON public.user_rooms
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();