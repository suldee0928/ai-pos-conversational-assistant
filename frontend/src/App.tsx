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
  reply?: string;
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



      const meta = data.intent
        ? `Intent: ${data.intent.intent} | Confidence: ${data.intent.confidence}`
        : undefined;
        
        const replyText = data.reply ?? "Request processed.";

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