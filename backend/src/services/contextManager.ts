export type SessionContext = {
  lastIntent?: string;
  lastParameters?: {
    date: string | null;
    at: string | null;
    a_from: string | null;
    a_to: string | null;
    b_from: string | null;
    b_to: string | null;
  };
  lastResult?: unknown;
};

const sessionStore = new Map<string, SessionContext>();

export function getSessionContext(sessionId: string): SessionContext {
  return sessionStore.get(sessionId) ?? {};
}

export function updateSessionContext(
  sessionId: string,
  patch: Partial<SessionContext>
): SessionContext {
  const current = sessionStore.get(sessionId) ?? {};
  const next = { ...current, ...patch };
  sessionStore.set(sessionId, next);
  return next;
}