-- Performance indexes for common query patterns

-- question_responses: queries by child_id + answered_at range
create index if not exists idx_question_responses_child_answered
  on question_responses (child_id, answered_at desc);

-- study_sessions: queries by child_id + started_at
create index if not exists idx_study_sessions_child_started
  on study_sessions (child_id, started_at desc);

-- study_sessions: queries by child_id + completed_at (non-null)
create index if not exists idx_study_sessions_child_completed
  on study_sessions (child_id, completed_at desc)
  where completed_at is not null;

-- topic_mastery: queries by child_id
create index if not exists idx_topic_mastery_child
  on topic_mastery (child_id);

-- ai_insights: queries by child_id + is_read
create index if not exists idx_ai_insights_child_unread
  on ai_insights (child_id, is_read)
  where is_read = false;

-- streaks: queries by child_id
create index if not exists idx_streaks_child
  on streaks (child_id);
