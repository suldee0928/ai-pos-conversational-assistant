import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

type ChatResponse = {
  success: boolean;
  intent?: {
    intent: string;
    parameters: Record<string, unknown>;
    confidence: number;
  };
  result?: {
    type: string;
    data: unknown;
  };
  reply?: string;
  replySource?: "mcp" | "formatter" | "llm_grounded";
  error?: string;
};

type Message = {
  role: "user" | "assistant";
  text: string;
  meta?: string;
  createdAt: string;
};

const SUGGESTIONS = [
  "How much revenue did we make on 2026-03-06?",
  "Show revenue by payment type for yesterday",
  "Top 5 best selling products on 2026-03-06",
  "Sales by employee on 2026-03-06",
  "What products are low stock?"
];

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 10h8M8 14h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M7 4h10a3 3 0 013 3v9l-3-2H7a3 3 0 01-3-3V7a3 3 0 013-3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function App() {
  const apiBaseUrl = useMemo(
    () => (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:3000",
    []
  );
  const chatApiKey = (import.meta.env.VITE_CHAT_API_KEY as string | undefined) ?? "";
  const mcpConnected =
    ((import.meta.env.VITE_MCP_CONNECTED as string | undefined) ?? "false").toLowerCase() ===
    "true";
  // Prototype: persistent session identifier for server-side conversational context recovery.
  const [sessionId] = useState("demo-session-1");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const chatWindowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chatWindowRef.current) return;
    chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setMessages((prev) => [
      ...prev,
      { role: "user", text: userMessage, createdAt: new Date().toISOString() }
    ]);
    setInput("");
    setLoading(true);
    setErrorBanner(null);

    try {
      // Intent summary supports transparency and evaluation; `reply` is the main user-visible text.
      const response = await fetch(`${apiBaseUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(chatApiKey ? { "x-api-key": chatApiKey } : {})
        },
        body: JSON.stringify({
          sessionId,
          message: userMessage
        })
      });

      const data: ChatResponse = await response.json();

      if (!data.success) {
        const errorText = `Error: ${data.error ?? "Unknown error"}`;
        setErrorBanner(errorText);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: errorText,
            createdAt: new Date().toISOString()
          }
        ]);
        return;
      }

      const meta = data.intent
        ? `Intent: ${data.intent.intent} | Confidence: ${data.intent.confidence.toFixed(2)}${
            data.replySource ? ` | Source: ${data.replySource.toUpperCase()}` : ""
          }`
        : undefined;
      const replyText = data.reply ?? "Request processed.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: replyText,
          meta,
          createdAt: new Date().toISOString()
        }
      ]);
    } catch {
      setErrorBanner("Network error while contacting backend.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Network error while contacting backend.",
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="app">
      <div className="chat-card">
        <header className="chat-header">
          <div className="brand-mark">
            <ChatIcon />
          </div>
          <div className="chat-header-text">
            <p className="eyebrow">Thesis prototype</p>
            <h1>POS Conversational Assistant</h1>
            <p className="subtitle">
              Ask about revenue, shifts, and comparisons in plain language—answers come from your
              read-only POS-style data.
            </p>
          </div>
        </header>

        <div className="status-toolbar">
          <span className="badge mode-badge">Mode: Chat API</span>
          <span className={`badge ${mcpConnected ? "ok-badge" : "warn-badge"}`}>
            MCP: {mcpConnected ? "Connected" : "Not connected"}
          </span>
          <span className="badge">Session: {sessionId}</span>
          <span className="badge" title="Backend base URL">
            API: {apiBaseUrl}
          </span>
        </div>

        {errorBanner && (
          <div className="error-banner" role="alert">
            {errorBanner}
          </div>
        )}

        <div className="chat-shell">
          <div className="chat-window" ref={chatWindowRef}>
            {messages.length === 0 && (
              <div className="placeholder-wrap">
                <p className="placeholder-intro">Try asking</p>
                <p className="placeholder-hint">
                  Example: <span>How much revenue did we make on 2026-03-06?</span>
                </p>
                <div className="suggestion-row">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="suggestion-chip"
                      onClick={() => setInput(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.role}`}
                aria-label={msg.role === "user" ? "Your message" : "Assistant reply"}
              >
                {msg.role === "assistant" && (
                  <div className="msg-label" aria-hidden title="Assistant">
                    AI
                  </div>
                )}
                <div className="bubble-wrap">
                  <div className="bubble">
                    <div>{msg.text}</div>
                    {msg.meta && <div className="meta">{msg.meta}</div>}
                    <div className="timestamp">{formatTime(msg.createdAt)}</div>
                  </div>
                </div>
                {msg.role === "user" && (
                  <div className="msg-label" aria-hidden title="You">
                    You
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="message assistant" aria-busy="true" aria-live="polite">
                <div className="msg-label" aria-hidden>
                  AI
                </div>
                <div className="bubble-wrap">
                  <div className="bubble loading-bubble">
                    <span>Thinking</span>
                    <span className="loading-dots" aria-hidden>
                      <span />
                      <span />
                      <span />
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="input-panel">
            <label className="input-label" htmlFor="chat-input">
              Message
            </label>
            <div className="input-row">
              <textarea
                id="chat-input"
                value={input}
                placeholder="Ask about revenue, shifts, or comparisons…"
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                autoComplete="off"
                aria-label="Chat message"
              />
              <button
                type="button"
                className="btn-send"
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                aria-label={loading ? "Sending message" : "Send message"}
              >
                <SendIcon />
                {loading ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
