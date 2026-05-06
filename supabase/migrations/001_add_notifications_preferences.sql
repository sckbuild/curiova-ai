-- Add notifications_preferences JSONB column to children table
alter table children
  add column if not exists notifications_preferences jsonb not null default '{
    "weekly_report": true,
    "streak_alerts": true,
    "milestone_celebrations": true,
    "low_performance_alerts": false
  }'::jsonb;

comment on column children.notifications_preferences is 'Parent notification preferences per child';
