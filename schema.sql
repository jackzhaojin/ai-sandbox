-- Task Scheduler API — Database Schema + Seed Data
-- Step 1/21: [PREREQUISITE-0]
-- Schema: public (tables prefixed with ts_ to avoid conflicts with shared Supabase instance)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS
-- ============================================
CREATE TABLE IF NOT EXISTS ts_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ts_users IS 'Users who own tasks';

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS ts_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES ts_users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ts_categories IS 'Task categories per user';

-- ============================================
-- TASKS
-- ============================================
CREATE TABLE IF NOT EXISTS ts_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES ts_users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'blocked')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    estimated_minutes INTEGER CHECK (estimated_minutes > 0),
    actual_minutes INTEGER CHECK (actual_minutes > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ts_tasks IS 'Main task entity';

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ts_tasks_user_id ON ts_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_ts_tasks_status ON ts_tasks(status);
CREATE INDEX IF NOT EXISTS idx_ts_tasks_priority ON ts_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_ts_tasks_due_date ON ts_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_ts_tasks_user_status ON ts_tasks(user_id, status);

-- ============================================
-- TASK CATEGORIES (many-to-many)
-- ============================================
CREATE TABLE IF NOT EXISTS ts_task_categories (
    task_id UUID NOT NULL REFERENCES ts_tasks(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES ts_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (task_id, category_id)
);

COMMENT ON TABLE ts_task_categories IS 'Junction table linking tasks to categories';

-- ============================================
-- TASK DEPENDENCIES (complex scheduling logic)
-- ============================================
CREATE TABLE IF NOT EXISTS ts_task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES ts_tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES ts_tasks(id) ON DELETE CASCADE,
    dependency_type TEXT NOT NULL DEFAULT 'blocks' CHECK (dependency_type IN ('blocks', 'relates_to', 'duplicates')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (task_id, depends_on_task_id),
    CONSTRAINT no_self_dependency CHECK (task_id <> depends_on_task_id)
);

COMMENT ON TABLE ts_task_dependencies IS 'Task dependency graph for complex scheduling';

CREATE INDEX IF NOT EXISTS idx_ts_task_deps_task_id ON ts_task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_ts_task_deps_depends_on ON ts_task_dependencies(depends_on_task_id);

-- ============================================
-- TASK SCHEDULES (recurring tasks)
-- ============================================
CREATE TABLE IF NOT EXISTS ts_task_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES ts_tasks(id) ON DELETE CASCADE,
    recurrence_rule TEXT NOT NULL,
    next_run_at TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ts_task_schedules IS 'Recurring task schedules';

CREATE INDEX IF NOT EXISTS idx_ts_task_schedules_next_run ON ts_task_schedules(next_run_at) WHERE is_active = TRUE;

-- ============================================
-- TASK LOGS (audit trail)
-- ============================================
CREATE TABLE IF NOT EXISTS ts_task_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES ts_tasks(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'status_changed', 'completed', 'deleted', 'dependency_added', 'dependency_removed')),
    old_value JSONB,
    new_value JSONB,
    performed_by UUID REFERENCES ts_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ts_task_logs IS 'Audit trail for task changes';

CREATE INDEX IF NOT EXISTS idx_ts_task_logs_task_id ON ts_task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_ts_task_logs_created_at ON ts_task_logs(created_at);

-- ============================================
-- UPDATE TRIGGER for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION ts_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ts_update_users_updated_at ON ts_users;
CREATE TRIGGER ts_update_users_updated_at BEFORE UPDATE ON ts_users
    FOR EACH ROW EXECUTE FUNCTION ts_update_updated_at_column();

DROP TRIGGER IF EXISTS ts_update_categories_updated_at ON ts_categories;
CREATE TRIGGER ts_update_categories_updated_at BEFORE UPDATE ON ts_categories
    FOR EACH ROW EXECUTE FUNCTION ts_update_updated_at_column();

DROP TRIGGER IF EXISTS ts_update_tasks_updated_at ON ts_tasks;
CREATE TRIGGER ts_update_tasks_updated_at BEFORE UPDATE ON ts_tasks
    FOR EACH ROW EXECUTE FUNCTION ts_update_updated_at_column();

DROP TRIGGER IF EXISTS ts_update_task_schedules_updated_at ON ts_task_schedules;
CREATE TRIGGER ts_update_task_schedules_updated_at BEFORE UPDATE ON ts_task_schedules
    FOR EACH ROW EXECUTE FUNCTION ts_update_updated_at_column();

-- ============================================
-- SEED DATA
-- ============================================

-- Users
INSERT INTO ts_users (id, email, name, avatar_url, created_at) VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'alice@example.com', 'Alice Johnson', 'https://i.pravatar.cc/150?u=alice', NOW()),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'bob@example.com', 'Bob Smith', 'https://i.pravatar.cc/150?u=bob', NOW()),
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'carol@example.com', 'Carol Williams', 'https://i.pravatar.cc/150?u=carol', NOW())
ON CONFLICT (id) DO NOTHING;

-- Categories
INSERT INTO ts_categories (id, user_id, name, color, created_at) VALUES
    ('d4e5f6a7-b8c9-0123-defa-234567890123', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Work', '#3B82F6', NOW()),
    ('e5f6a7b8-c9d0-1234-efab-345678901234', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Personal', '#10B981', NOW()),
    ('f6a7b8c9-d0e1-2345-fabc-456789012345', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Urgent', '#EF4444', NOW()),
    ('a7b8c9d0-e1f2-3456-abcd-567890123456', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Development', '#8B5CF6', NOW()),
    ('b8c9d0e1-f2a3-4567-bcde-678901234567', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Meetings', '#F59E0B', NOW())
ON CONFLICT (id) DO NOTHING;

-- Tasks
INSERT INTO ts_tasks (id, user_id, title, description, status, priority, due_date, started_at, completed_at, estimated_minutes, actual_minutes, created_at, updated_at) VALUES
    ('11111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Q2 Marketing Plan', 'Draft the marketing strategy for Q2 including social media and email campaigns.', 'in_progress', 'high', NOW() + INTERVAL '3 days', NOW() - INTERVAL '1 day', NULL, 480, 180, NOW() - INTERVAL '2 days', NOW()),
    ('22222222-2222-2222-2222-222222222222', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Fix onboarding bug', 'Users report the onboarding flow breaks at step 3 on mobile Safari.', 'pending', 'urgent', NOW() + INTERVAL '1 day', NULL, NULL, 120, NULL, NOW() - INTERVAL '1 day', NOW()),
    ('33333333-3333-3333-3333-333333333333', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Weekly team sync', 'Prepare agenda and slides for the weekly all-hands meeting.', 'completed', 'medium', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', 60, 75, NOW() - INTERVAL '5 days', NOW()),
    ('44444444-4444-4444-4444-444444444444', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Update documentation', 'Refresh API docs with new endpoints and examples.', 'pending', 'low', NOW() + INTERVAL '7 days', NULL, NULL, 240, NULL, NOW() - INTERVAL '3 days', NOW()),
    ('55555555-5555-5555-5555-555555555555', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Client presentation', 'Prepare slides for the quarterly review with Acme Corp.', 'blocked', 'high', NOW() + INTERVAL '2 days', NULL, NULL, 300, NULL, NOW() - INTERVAL '2 days', NOW()),
    ('66666666-6666-6666-6666-666666666666', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Database migration', 'Migrate user preferences table to new schema with JSONB column.', 'in_progress', 'high', NOW() + INTERVAL '2 days', NOW() - INTERVAL '2 days', NULL, 360, 240, NOW() - INTERVAL '4 days', NOW()),
    ('77777777-7777-7777-7777-777777777777', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Code review PR #482', 'Review the auth middleware refactor before merge.', 'pending', 'medium', NOW() + INTERVAL '1 day', NULL, NULL, 90, NULL, NOW(), NOW()),
    ('88888888-8888-8888-8888-888888888888', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Deploy v2.4.0', 'Production deployment checklist and rollout.', 'pending', 'urgent', NOW() + INTERVAL '12 hours', NULL, NULL, 60, NULL, NOW() - INTERVAL '6 hours', NOW()),
    ('99999999-9999-9999-9999-999999999999', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Write integration tests', 'Add Playwright tests for the checkout flow.', 'completed', 'medium', NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', 300, 360, NOW() - INTERVAL '5 days', NOW()),
    ('00000000-0000-0000-0000-000000000000', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'Design system audit', 'Review component library for accessibility gaps.', 'pending', 'high', NOW() + INTERVAL '4 days', NULL, NULL, 240, NULL, NOW() - INTERVAL '1 day', NOW())
ON CONFLICT (id) DO NOTHING;

-- Task Categories
INSERT INTO ts_task_categories (task_id, category_id) VALUES
    ('11111111-1111-1111-1111-111111111111', 'd4e5f6a7-b8c9-0123-defa-234567890123'),
    ('22222222-2222-2222-2222-222222222222', 'f6a7b8c9-d0e1-2345-fabc-456789012345'),
    ('22222222-2222-2222-2222-222222222222', 'd4e5f6a7-b8c9-0123-defa-234567890123'),
    ('33333333-3333-3333-3333-333333333333', 'd4e5f6a7-b8c9-0123-defa-234567890123'),
    ('44444444-4444-4444-4444-444444444444', 'e5f6a7b8-c9d0-1234-efab-345678901234'),
    ('55555555-5555-5555-5555-555555555555', 'f6a7b8c9-d0e1-2345-fabc-456789012345'),
    ('66666666-6666-6666-6666-666666666666', 'a7b8c9d0-e1f2-3456-abcd-567890123456'),
    ('77777777-7777-7777-7777-777777777777', 'a7b8c9d0-e1f2-3456-abcd-567890123456'),
    ('88888888-8888-8888-8888-888888888888', 'a7b8c9d0-e1f2-3456-abcd-567890123456'),
    ('88888888-8888-8888-8888-888888888888', 'b8c9d0e1-f2a3-4567-bcde-678901234567'),
    ('99999999-9999-9999-9999-999999999999', 'a7b8c9d0-e1f2-3456-abcd-567890123456')
ON CONFLICT (task_id, category_id) DO NOTHING;

-- Task Dependencies
INSERT INTO ts_task_dependencies (id, task_id, depends_on_task_id, dependency_type, created_at) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'blocks', NOW()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '88888888-8888-8888-8888-888888888888', '77777777-7777-7777-7777-777777777777', 'blocks', NOW()),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '66666666-6666-6666-6666-666666666666', '99999999-9999-9999-9999-999999999999', 'relates_to', NOW())
ON CONFLICT (task_id, depends_on_task_id) DO NOTHING;

-- Task Schedules
INSERT INTO ts_task_schedules (id, task_id, recurrence_rule, next_run_at, end_date, is_active, created_at) VALUES
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', 'FREQ=WEEKLY;BYDAY=MO', NOW() + INTERVAL '7 days', NOW() + INTERVAL '3 months', TRUE, NOW()),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '77777777-7777-7777-7777-777777777777', 'FREQ=DAILY;INTERVAL=1', NOW() + INTERVAL '1 day', NULL, TRUE, NOW())
ON CONFLICT (id) DO NOTHING;

-- Task Logs
INSERT INTO ts_task_logs (id, task_id, action, old_value, new_value, performed_by, created_at) VALUES
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', '11111111-1111-1111-1111-111111111111', 'created', NULL, '{"title":"Q2 Marketing Plan","status":"pending"}'::jsonb, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NOW() - INTERVAL '2 days'),
    ('11111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'status_changed', '{"status":"pending"}'::jsonb, '{"status":"in_progress"}'::jsonb, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NOW() - INTERVAL '1 day'),
    ('11111111-1111-1111-1111-111111111113', '33333333-3333-3333-3333-333333333333', 'created', NULL, '{"title":"Weekly team sync","status":"pending"}'::jsonb, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NOW() - INTERVAL '5 days'),
    ('11111111-1111-1111-1111-111111111114', '33333333-3333-3333-3333-333333333333', 'completed', '{"status":"in_progress"}'::jsonb, '{"status":"completed"}'::jsonb, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', NOW() - INTERVAL '1 day'),
    ('11111111-1111-1111-1111-111111111115', '66666666-6666-6666-6666-666666666666', 'created', NULL, '{"title":"Database migration","status":"pending"}'::jsonb, 'b2c3d4e5-f6a7-8901-bcde-f12345678901', NOW() - INTERVAL '4 days'),
    ('11111111-1111-1111-1111-111111111116', '66666666-6666-6666-6666-666666666666', 'status_changed', '{"status":"pending"}'::jsonb, '{"status":"in_progress"}'::jsonb, 'b2c3d4e5-f6a7-8901-bcde-f12345678901', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;
