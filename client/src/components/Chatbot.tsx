import React, { useState, useRef, useEffect } from "react";
import "../styles/ChatBot.css";
import ReactMarkdown from "react-markdown";
import { useTheme } from "./ThemeContext";

interface ChatBotProps {
  notes: {
    id: string;
    title: string;
    markdown: string;
    tags: { id: string; label: string }[];
  }[];
}

const ChatBot: React.FC<ChatBotProps> = ({ notes }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme }=useTheme();

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message + start typing effect
  const sendMessage = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage = { role: "user" as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsGenerating(true);

    try {
      const res = await fetch("https://notetake-ai.onrender.com/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          notes: notes,
        }),
      });

      const data = await res.json();
      const fullReply = data.reply;

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "" }
      ]);

      let index = 0;
      typingIntervalRef.current = setInterval(() => {
        index++;
        setMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];

          if (last.role === "assistant") {
            updated[updated.length - 1] = {
              ...last,
              content: fullReply.slice(0, index),
              role: "assistant",
            };
          }

          return updated;
        });

        if (index >= fullReply.length) {
          clearInterval(typingIntervalRef.current!);
          setIsGenerating(false);

          setTimeout(() => {
            inputRef.current?.focus();
          },100);
        }
      }, 20);
    } catch (err) {
      console.error(err);
      setIsGenerating(false);

      setTimeout(() => {
        inputRef.current?.focus();
      },100);
    }
  };

  // Stop typing effect
  const stopGenerating = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
      setIsGenerating(false);
      setTimeout(() => {
        inputRef.current?.focus();
      },100);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        chatRef.current &&
        !chatRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen]);


  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100); // Small delay to ensure DOM is ready
    }
  }, [isOpen]);


  return (
    <div className={`chatbot-container ${isOpen ? "open" : ""}`}>
      {!isOpened && (
        <div className="chat-thought" style={{backgroundColor:theme==="dark"?"#215f94ef":"", color:theme==="dark"?"white":"black"}}>
          Powered by AI.<br /> Ask me anything about your notes.
          <div className="thought-tail" />
        </div>
      )}
      <button className="chat-toggle" onClick={() => {
        setIsOpen(prev => !prev);
        setIsOpened(true);
        }}>
        💬
      </button>
      

      {isOpen && (
        <div className="chat-window" ref={chatRef}>
          <div className="chat-messages section-blur">

            {messages.length===0?(
              <div className="chat-placeholder">
                <em>I'm here to help. Ask me anything!</em>
              </div>
            ):(messages.map((msg, idx) => (
              <div key={idx} className={`chat-msg ${msg.role}`}>
                <strong>{msg.role === "user" ? "You" : "Bot"}:</strong>{" "}
                {msg.role === "assistant" ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !isGenerating && sendMessage()}
              placeholder="Ask me anything..."
              disabled={isGenerating}
            />
            {isGenerating ? (
              <button onClick={stopGenerating}>Stop</button>
            ) : (
              <button onClick={sendMessage}>Send</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
