--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: placed_tiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.placed_tiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
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
    subject_type text DEFAULT 'Lec'::text,
    lab_type text,
    is_asynchronous boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: saved_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.saved_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    schedule_id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    tiles jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT saved_schedules_type_check CHECK ((type = ANY (ARRAY['teacher'::text, 'section'::text, 'room'::text])))
);


--
-- Name: user_rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_rooms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    rooms jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_tiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_tiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
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
    subject_type text DEFAULT 'Lec'::text,
    lab_type text,
    is_asynchronous boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: placed_tiles placed_tiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.placed_tiles
    ADD CONSTRAINT placed_tiles_pkey PRIMARY KEY (id);


--
-- Name: saved_schedules saved_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_schedules
    ADD CONSTRAINT saved_schedules_pkey PRIMARY KEY (id);


--
-- Name: user_rooms user_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_rooms
    ADD CONSTRAINT user_rooms_pkey PRIMARY KEY (id);


--
-- Name: user_rooms user_rooms_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_rooms
    ADD CONSTRAINT user_rooms_user_id_key UNIQUE (user_id);


--
-- Name: user_tiles user_tiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tiles
    ADD CONSTRAINT user_tiles_pkey PRIMARY KEY (id);


--
-- Name: placed_tiles set_updated_at_placed_tiles; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_placed_tiles BEFORE UPDATE ON public.placed_tiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: user_rooms set_updated_at_user_rooms; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_user_rooms BEFORE UPDATE ON public.user_rooms FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: user_tiles set_updated_at_user_tiles; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at_user_tiles BEFORE UPDATE ON public.user_tiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: placed_tiles placed_tiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.placed_tiles
    ADD CONSTRAINT placed_tiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: saved_schedules saved_schedules_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.saved_schedules
    ADD CONSTRAINT saved_schedules_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_rooms user_rooms_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_rooms
    ADD CONSTRAINT user_rooms_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_tiles user_tiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tiles
    ADD CONSTRAINT user_tiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: placed_tiles Users can delete their own placed tiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own placed tiles" ON public.placed_tiles FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_rooms Users can delete their own rooms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own rooms" ON public.user_rooms FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: saved_schedules Users can delete their own schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own schedules" ON public.saved_schedules FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: user_tiles Users can delete their own tiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own tiles" ON public.user_tiles FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: placed_tiles Users can insert their own placed tiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own placed tiles" ON public.placed_tiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_rooms Users can insert their own rooms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own rooms" ON public.user_rooms FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: saved_schedules Users can insert their own schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own schedules" ON public.saved_schedules FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_tiles Users can insert their own tiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own tiles" ON public.user_tiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: placed_tiles Users can update their own placed tiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own placed tiles" ON public.placed_tiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_rooms Users can update their own rooms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own rooms" ON public.user_rooms FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: saved_schedules Users can update their own schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own schedules" ON public.saved_schedules FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_tiles Users can update their own tiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own tiles" ON public.user_tiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: placed_tiles Users can view their own placed tiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own placed tiles" ON public.placed_tiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_rooms Users can view their own rooms; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own rooms" ON public.user_rooms FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: saved_schedules Users can view their own schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own schedules" ON public.saved_schedules FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_tiles Users can view their own tiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tiles" ON public.user_tiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: placed_tiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.placed_tiles ENABLE ROW LEVEL SECURITY;

--
-- Name: saved_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.saved_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: user_rooms; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_rooms ENABLE ROW LEVEL SECURITY;

--
-- Name: user_tiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_tiles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


