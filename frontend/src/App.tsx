import { useState } from "react";
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
  error?: string;
};

type Message = {
  role: "user" | "assistant";
  text: string;
  meta?: string;
};

function App() {
  const [sessionId] = useState("demo-session-1");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionId,
          message: userMessage
        })
      });

      const data: ChatResponse = await response.json();

      if (!data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: `Error: ${data.error ?? "Unknown error"}`
          }
        ]);
        return;
      }

      let replyText = "Request processed.";
      if (data.result?.type === "REVENUE") {
          replyText = `Revenue: ${data.result.data}`;
            } else if (data.result?.type === "CURRENT_SHIFTS") {
    const shifts = Array.isArray(data.result.data) ? data.result.data : [];

  if (shifts.length === 0) {
    replyText = "No employees are currently on shift.";
      } else {
        const names = shifts.map((shift: any) => shift.employee?.name ?? "Unknown").join(", ");

    replyText = `Currently working: ${names}`;
  }
} else if (data.result?.type === "COMPARE_REVENUE") {
  const compare = data.result.data as any;
  replyText = `Comparison — Period A: ${compare.periodA}, Period B: ${compare.periodB}`;
}

      const meta = data.intent
        ? `Intent: ${data.intent.intent} | Confidence: ${data.intent.confidence}`
        : undefined;

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: replyText,
          meta
        }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Network error while contacting backend."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      sendMessage();
    }
  }

  return (
    <div className="app">
      <div className="chat-card">
        <h1>POS Conversational Assistant</h1>
        <p className="subtitle">AI-powered query interface for POS data</p>

        <div className="chat-window">
          {messages.length === 0 && (
            <div className="placeholder">
              Try: <span>How much revenue did we make on 2026-03-06?</span>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <div className="bubble">
                <div>{msg.text}</div>
                {msg.meta && <div className="meta">{msg.meta}</div>}
              </div>
            </div>
          ))}
        </div>

        <div className="input-row">
          <input
            type="text"
            value={input}
            placeholder="Type your question..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button onClick={sendMessage} disabled={loading}>
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;