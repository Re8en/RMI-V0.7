-- ============================================================
-- RMI v0.7 — Supabase Database Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. PEOPLE table (relational map contacts)
CREATE TABLE IF NOT EXISTS public.people (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  ring TEXT NOT NULL DEFAULT 'Outer',
  "group" TEXT NOT NULL DEFAULT 'Other',
  support_types TEXT[] NOT NULL DEFAULT '{}',
  last_interaction TEXT NOT NULL DEFAULT 'Unknown',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own people"
  ON public.people FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own people"
  ON public.people FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own people"
  ON public.people FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own people"
  ON public.people FOR DELETE
  USING (auth.uid() = user_id);


-- 2. CHAT_MESSAGES table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
  text TEXT NOT NULL,
  "timestamp" BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON public.chat_messages FOR DELETE
  USING (auth.uid() = user_id);


-- 3. USER_STATE table (per-user app state)
CREATE TABLE IF NOT EXISTS public.user_state (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  e_user INTEGER NOT NULL DEFAULT 65,
  ai_session_count INTEGER NOT NULL DEFAULT 0,
  real_event_count INTEGER NOT NULL DEFAULT 0,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  settings JSONB NOT NULL DEFAULT '{"highlightNames":true,"confirmBeforeAdd":true,"showSupportStats":true,"showInteractionMarkers":true}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own state"
  ON public.user_state FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own state"
  ON public.user_state FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own state"
  ON public.user_state FOR UPDATE
  USING (auth.uid() = user_id);


-- 4. FEEDBACK table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
  ON public.feedback FOR SELECT
  USING (auth.uid() = user_id);
