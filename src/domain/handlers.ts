// ---------------------------------------------------------------------------
// Task handler system — demo handlers for scheduler invocation
// ---------------------------------------------------------------------------

/**
 * Result shape returned by every handler.
 */
export interface HandlerResult {
  success: boolean;
  output?: unknown;
  error?: string;
}

/**
 * A handler function receives a payload and returns a promise that resolves
 * to a HandlerResult.
 */
export type HandlerFn = (payload: unknown) => Promise<HandlerResult>;

// ---------------------------------------------------------------------------
// Demo handlers
// ---------------------------------------------------------------------------

/**
 * Echo handler — returns the payload unchanged.
 */
export async function echoHandler(payload: unknown): Promise<HandlerResult> {
  return { success: true, output: payload };
}

/**
 * Flaky handler — randomly fails 50% of the time.
 */
export async function flakyHandler(_payload: unknown): Promise<HandlerResult> {
  if (Math.random() < 0.5) {
    return { success: false, error: 'random failure' };
  }
  return { success: true, output: 'ok' };
}

/**
 * Slow handler — sleeps for 5 seconds, then returns.
 */
export async function slowHandler(_payload: unknown): Promise<HandlerResult> {
  await new Promise<void>((resolve) => setTimeout(resolve, 5000));
  return { success: true, output: 'done' };
}

// ---------------------------------------------------------------------------
// Handler registry
// ---------------------------------------------------------------------------

/**
 * Map of handler names to their implementations.
 */
export const handlerRegistry: Record<string, HandlerFn> = {
  echo: echoHandler,
  flaky: flakyHandler,
  slow: slowHandler,
};

/**
 * Look up a handler by name. Throws if the handler is not registered.
 */
export function getHandler(name: string): HandlerFn {
  const handler = handlerRegistry[name];
  if (!handler) {
    throw new Error(`Handler not found: "${name}"`);
  }
  return handler;
}

/**
 * Execute a registered handler by name with the given payload.
 * Returns the handler's result directly.
 */
export async function executeHandler(
  name: string,
  payload: unknown
): Promise<HandlerResult> {
  const handler = getHandler(name);
  return handler(payload);
}
