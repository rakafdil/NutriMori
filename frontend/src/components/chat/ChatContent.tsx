"use client";
import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
// Pastikan menggunakan library yang sesuai, biasanya @google/generative-ai untuk web client
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ChatMessage } from "@/types";

// Inisialisasi di luar komponen untuk mencegah re-init
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_API_KEY as string);

const ChatContent: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "model",
      text: "Halo! Aku NutriMori. Ada yang bisa kubantu soal pola makanmu hari ini?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load preferences sekali saat mount
  useEffect(() => {
    const storedPrefs = localStorage.getItem("nutrimori_preferences");
    if (storedPrefs) {
      setPreferences(storedPrefs);
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: input,
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // 1. Dapatkan model
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite", // Gunakan flash untuk hemat biaya & token
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 250, // Tambahkan ini agar panjang jawaban pas
        },
      });

      // 2. Konstruksi System Instruction Dinamis
      // Kita masukkan preferences ke sini agar model selalu ingat tanpa perlu input ulang
      const systemInstruction = `
        Kamu adalah asisten nutrisi ramah bernama NutriMori.
        Gaya bicara: Santai, empatik, akurat secara sains, dan ringkas.
        Bahasa: Indonesia.
        
        DATA PENGGUNA (Gunakan ini sebagai konteks utama jawabanmu):
        ${
          preferences
            ? `Preferensi/Kondisi Diet: ${preferences}`
            : "User belum mengatur preferensi khusus."
        }
        
        PENTING: Jawablah dengan singkat dan padat.
      `;

      // 3. OPTIMISASI TOKEN: Sliding Window Context
      // Hanya ambil 3 pesan terakhir untuk dikirim ke API.
      // Ini drastis mengurangi input token dibanding mengirim seluruh history.
      const recentHistory = messages.slice(-3).map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

      // Mulai chat dengan history terbatas + instruksi sistem
      const chatSession = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: systemInstruction }], // Hack: Masukkan system prompt di awal turn
          },
          {
            role: "model",
            parts: [
              {
                text: "Mengerti, saya siap membantu sebagai NutriMori dengan preferensi tersebut.",
              },
            ],
          },
          ...recentHistory,
        ],
      });

      const result = await chatSession.sendMessage(userMsg.text);
      const text = result.response.text();

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "model", text },
      ]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "model",
          text: "Maaf, koneksi terputus sebentar. Coba lagi ya.",
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
      {/* Container Utama */}
      <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 transition-colors">
        {/* Header dengan Indikator Preferences */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3 transition-colors justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-400 to-lime-300 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-none">
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
          {/* Indikator visual jika preferences aktif */}
          {preferences && (
            <div className="hidden md:flex px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-full text-xs text-emerald-700 dark:text-emerald-300">
              ✨ Personalization Active
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/50 transition-colors">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex w-full ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex max-w-[85%] md:max-w-[70%] gap-2 ${
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
                  className={`p-3 px-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-gray-800 dark:bg-emerald-600 text-white rounded-tr-none"
                      : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start w-full">
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm ml-10">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-75"></span>
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-150"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length < 3 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="whitespace-nowrap px-3 py-1.5 bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 text-xs rounded-full border border-emerald-100 dark:border-gray-600 hover:bg-emerald-50 dark:hover:bg-gray-700 transition shadow-sm"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 transition-colors">
          <div className="flex gap-2 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                preferences
                  ? "Tanya sesuai dietmu..."
                  : "Tanya sesuatu tentang makanan..."
              }
              className="w-full bg-gray-100 dark:bg-gray-700/50 border-transparent focus:bg-white dark:focus:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full pl-5 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white dark:placeholder-gray-400"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="absolute right-1.5 top-1.5 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full transition-all disabled:opacity-50 disabled:scale-90 shadow-md shadow-emerald-200 dark:shadow-none"
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
