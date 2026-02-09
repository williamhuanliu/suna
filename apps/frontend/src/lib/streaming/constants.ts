export const STREAM_CONFIG = {
  /** Allow long gaps when LLM is generating large tool call content (e.g. create_file with a full report). */
  HEARTBEAT_TIMEOUT_MS: 120000, // 2 minutes (was 30s; large file creation can take 1–2 min)
  HEARTBEAT_CHECK_INTERVAL_MS: 15000, // check every 15s
  
  RECONNECT_BASE_DELAY_MS: 500,
  RECONNECT_MAX_DELAY_MS: 10000,
  RECONNECT_MAX_ATTEMPTS: 5,
  RECONNECT_BACKOFF_MULTIPLIER: 2,
  
  STATUS_CHECK_DELAY_MS: 500,
  
  /**
   * Throttle interval for tool-call state updates.
   * 16ms (≈60fps) causes page freeze on large create_file because each update
   * triggers O(n) JSON.stringify + JSON.parse on the full accumulated arguments
   * (which can reach 80k+ chars). 150ms (~7 updates/sec) is imperceptible for
   * streaming preview and eliminates the freeze.
   */
  TOOL_CALL_THROTTLE_MS: 150,
  
  CONTENT_FLUSH_INTERVAL_MS: 16,
  
  STREAM_POLL_BLOCK_MS: 500,
} as const;

export const TERMINAL_STATUSES = [
  'completed',
  'stopped',
  'failed',
  'error',
  'agent_not_running',
] as const;

export const BILLING_ERROR_KEYWORDS = [
  'insufficient credits',
  'out of credits',
  'no credits',
  'balance',
  'credit',
  'billing check failed',
] as const;

export const COMPLETION_MESSAGE_PATTERNS = [
  '"type": "status"',
  '"status": "completed"',
  'Run data not available for streaming',
  'Stream ended with status: completed',
] as const;

export const API_ENDPOINTS = {
  STREAM: (runId: string) => `/agent-run/${runId}/stream`,
  STOP: (runId: string) => `/agent-runs/${runId}/stop`,
  STATUS: (runId: string) => `/agent-runs/${runId}/status`,
} as const;

export type TerminalStatus = typeof TERMINAL_STATUSES[number];
