import { mkdir, readFile, writeFile, access } from 'fs/promises';
import { dirname } from 'path';
import type { AppState, Run, Task } from '../domain/types.js';

// ---------------------------------------------------------------------------
// Singleton state
// ---------------------------------------------------------------------------

const state: AppState = {
  tasks: new Map<string, Task>(),
  runs: new Map<string, Run>(),
};

const STATE_FILE_PATH = 'data/state.json';

// ---------------------------------------------------------------------------
// Debounce
// ---------------------------------------------------------------------------

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 5000;

function debouncedSave(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    saveState().catch((err) => {
      console.error('[persistence] auto-save failed:', err);
    });
  }, DEBOUNCE_MS);
}

// ---------------------------------------------------------------------------
// Serialization helpers
// ---------------------------------------------------------------------------

interface SerializedState {
  tasks: Array<[string, Task]>;
  runs: Array<[string, Run]>;
}

function serializeState(appState: AppState): SerializedState {
  return {
    tasks: Array.from(appState.tasks.entries()),
    runs: Array.from(appState.runs.entries()),
  };
}

function deserializeState(raw: SerializedState): AppState {
  const tasks = new Map<string, Task>();
  const runs = new Map<string, Run>();

  for (const [id, task] of raw.tasks ?? []) {
    tasks.set(id, reviveDates(task as unknown as Record<string, unknown>, ['created_at', 'updated_at']) as unknown as Task);
  }

  for (const [id, run] of raw.runs ?? []) {
    runs.set(id, reviveDates(run as unknown as Record<string, unknown>, ['started_at', 'finished_at', 'next_retry_at']) as unknown as Run);
  }

  return { tasks, runs };
}

function reviveDates<T extends Record<string, unknown>>(
  obj: T,
  dateKeys: readonly string[]
): T {
  const copy: Record<string, unknown> = { ...obj };
  for (const key of dateKeys) {
    const val = copy[key];
    if (val === null) {
      copy[key] = null;
    } else if (typeof val === 'string') {
      copy[key] = new Date(val);
    }
  }
  return copy as T;
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

export async function loadState(): Promise<void> {
  try {
    await access(STATE_FILE_PATH);
  } catch {
    // File does not exist; start with empty state
    state.tasks.clear();
    state.runs.clear();
    return;
  }

  const raw = await readFile(STATE_FILE_PATH, 'utf-8');
  const parsed: SerializedState = JSON.parse(raw);
  const hydrated = deserializeState(parsed);

  state.tasks = hydrated.tasks;
  state.runs = hydrated.runs;
}

export async function saveState(): Promise<void> {
  const serialized = serializeState(state);
  const json = JSON.stringify(serialized, null, 2);

  await mkdir(dirname(STATE_FILE_PATH), { recursive: true });
  await writeFile(STATE_FILE_PATH, json, 'utf-8');
}

export function init(): void {
  loadState().catch((err) => {
    console.error('[persistence] failed to load state:', err);
  });
}

// ---------------------------------------------------------------------------
// Getters
// ---------------------------------------------------------------------------

export function getTasks(): Map<string, Task> {
  return state.tasks;
}

export function getRuns(): Map<string, Run> {
  return state.runs;
}

export function getTask(id: string): Task | undefined {
  return state.tasks.get(id);
}

export function getRun(id: string): Run | undefined {
  return state.runs.get(id);
}

// ---------------------------------------------------------------------------
// Mutators
// ---------------------------------------------------------------------------

export function addTask(task: Task): void {
  state.tasks.set(task.id, task);
  debouncedSave();
}

export function updateTask(id: string, updates: Partial<Omit<Task, 'id'>>): void {
  const existing = state.tasks.get(id);
  if (!existing) {
    throw new Error(`Task not found: ${id}`);
  }
  const filteredUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  ) as Partial<Omit<Task, 'id'>>;
  state.tasks.set(id, { ...existing, ...filteredUpdates, updated_at: new Date() });
  debouncedSave();
}

export function deleteTask(id: string): void {
  state.tasks.delete(id);
  debouncedSave();
}

export function addRun(run: Run): void {
  state.runs.set(run.id, run);
  debouncedSave();
}

export function updateRun(id: string, updates: Partial<Omit<Run, 'id'>>): void {
  const existing = state.runs.get(id);
  if (!existing) {
    throw new Error(`Run not found: ${id}`);
  }
  state.runs.set(id, { ...existing, ...updates });
  debouncedSave();
}
