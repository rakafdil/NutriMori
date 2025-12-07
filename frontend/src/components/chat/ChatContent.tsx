"use client";
import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from "@/types";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_API_KEY });

const ChatContent: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "model",
      text: "Halo! Aku asisten nutrisimu. Ada yang bisa kubantu soal pola makan atau kesehatan hari ini?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: input,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const chatSession: Chat = ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction:
            "You are a friendly, empathetic nutrition assistant named NutriMori. Keep answers concise, helpful, and scientifically accurate but casual. Indonesian language.",
        },
      });

      const result: GenerateContentResponse = await chatSession.sendMessage({
        message: userMsg.text,
      });
      const text =
        result.text ||
        "Maaf, aku sedang berpikir keras tapi tidak bisa menjawab sekarang.";

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "model", text },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "model",
          text: "Maaf, terjadi kesalahan koneksi.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Kenapa aku sering lapar jam 10 pagi?",
    "Ide sarapan rendah kalori?",
    "Bahaya kebanyakan garam?",
  ];

  return (
    <div className="h-[calc(100vh-100px)] md:h-[calc(100vh-40px)] p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 transition-colors">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3 transition-colors">
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-400 to-lime-300 rounded-full flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 dark:text-white">
              NutriMori Assistant
            </h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>{" "}
              Online
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/50 transition-colors">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex w-full ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex max-w-[80%] gap-2 ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === "user"
                      ? "bg-gray-200 dark:bg-gray-600"
                      : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div
                  className={`p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gray-800 dark:bg-gray-700 text-white rounded-tr-none"
                      : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm text-gray-700 dark:text-gray-200 rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start w-full">
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce delay-75"></span>
                <span className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce delay-150"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length < 3 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="whitespace-nowrap px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs rounded-full border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 transition-colors">
          <div className="flex gap-2 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Tanya sesuatu tentang makanan..."
              className="w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-full pl-5 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white dark:placeholder-gray-400"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="absolute right-1.5 top-1.5 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatContent;
