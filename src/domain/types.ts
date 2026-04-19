import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export enum TaskStatus {
  Active = 'active',
  Paused = 'paused',
  Orphaned = 'orphaned',
}

export enum RunStatus {
  Queued = 'queued',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  BlockedOnDep = 'blocked_on_dep',
  SkippedOverlap = 'skipped_overlap',
}

// ---------------------------------------------------------------------------
// Domain interfaces
// ---------------------------------------------------------------------------

export interface Task {
  id: string;
  name: string;
  cron: string;
  payload: Record<string, unknown>;
  max_attempts: number;
  base_delay_ms: number;
  max_delay_ms: number;
  depends_on: string[];
  status: TaskStatus;
  created_at: Date;
  updated_at: Date;
}

export interface Run {
  id: string;
  task_id: string;
  status: RunStatus;
  attempt: number;
  started_at: Date | null;
  finished_at: Date | null;
  error: string | null;
  output: Record<string, unknown> | null;
  next_retry_at: Date | null;
}

export interface AppState {
  tasks: Map<string, Task>;
  runs: Map<string, Run>;
}

// ---------------------------------------------------------------------------
// Zod validation schemas
// ---------------------------------------------------------------------------

export const TaskCreateSchema = z.object({
  name: z.string().min(1),
  cron: z.string().min(1),
  payload: z.record(z.unknown()).default({}),
  max_attempts: z.number().int().min(1).default(3),
  base_delay_ms: z.number().int().min(0).default(1000),
  max_delay_ms: z.number().int().min(0).default(30000),
  depends_on: z.array(z.string().min(1)).default([]),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.Active),
});

export const TaskUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  cron: z.string().min(1).optional(),
  payload: z.record(z.unknown()).optional(),
  max_attempts: z.number().int().min(1).optional(),
  base_delay_ms: z.number().int().min(0).optional(),
  max_delay_ms: z.number().int().min(0).optional(),
  depends_on: z.array(z.string().min(1)).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
});
