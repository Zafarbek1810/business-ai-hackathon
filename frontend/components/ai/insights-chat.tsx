"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, Bot, Plus, Square, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useRadar } from "@/hooks/use-radar";
import { useAuth } from "@/features/auth/auth-context";
import { streamAiChat } from "@/services/radar";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS } from "@/types/api";
import { cn } from "@/lib/utils";
import { renderAnswerWithLinks } from "@/components/ai/render-answer";

type ChatRole = "user" | "assistant";
type ChatMessage = { id: string; role: ChatRole; content: string };

const THREADS_STORAGE_KEY = "br_insights_threads";

function loadStoredThreads(): Record<string, ChatMessage[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(THREADS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ChatMessage[]>) : {};
  } catch {
    return {};
  }
}

const SUGGESTIONS = [
  "Shu biznes hozir foyda keltiradimi?",
  "Zararsizlik nuqtasini tushuntirib bering",
  "Asosiy xavflar qanday?",
  "Narx yoki hajmni qanday o‘zgartirish kerak?",
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function InsightsChat() {
  const { businesses, businessesLoading } = useRadar();
  const { activeBusinessId, setActiveBusinessId } = useAuth();
  const ownBusinesses = businesses;
  const selectedId = ownBusinesses.some((item) => item.id === activeBusinessId)
    ? activeBusinessId
    : (ownBusinesses[0]?.id ?? null);
  const selected = ownBusinesses.find((item) => item.id === selectedId) ?? null;

  const [threads, setThreads] = useState<Record<string, ChatMessage[]>>(loadStoredThreads);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const queueRef = useRef("");
  const visibleRef = useRef("");
  const pumpingRef = useRef(false);

  const messages = selectedId ? (threads[selectedId] ?? []) : [];

  useEffect(() => {
    try {
      localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads));
    } catch {
      // storage unavailable (private mode, quota) - chat still works for this session
    }
  }, [threads]);

  useEffect(() => {
    if (selectedId && selectedId !== activeBusinessId) {
      setActiveBusinessId(selectedId);
    }
  }, [selectedId, activeBusinessId, setActiveBusinessId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  function updateAssistant(id: string, content: string) {
    if (!selectedId) return;
    setThreads((prev) => ({
      ...prev,
      [selectedId]: (prev[selectedId] ?? []).map((item) =>
        item.id === id ? { ...item, content } : item,
      ),
    }));
  }

  async function pump(id: string) {
    if (pumpingRef.current) return;
    pumpingRef.current = true;
    while (queueRef.current.length > 0) {
      const step = queueRef.current.length > 80 ? 2 : 1;
      const chunk = queueRef.current.slice(0, step);
      queueRef.current = queueRef.current.slice(step);
      visibleRef.current += chunk;
      updateAssistant(id, visibleRef.current);
      await sleep(queueRef.current.length > 80 ? 6 : 14);
    }
    pumpingRef.current = false;
  }

  async function send(text = input) {
    const question = text.trim();
    if (!selectedId || !question || streaming) return;

    const history = (threads[selectedId] ?? []).map((item) => ({
      role: item.role,
      content: item.content,
    }));
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
    };
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };
    queueRef.current = "";
    visibleRef.current = "";
    setThreads((prev) => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] ?? []), userMessage, assistantMessage],
    }));
    setInput("");
    setStreaming(true);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      await streamAiChat({
        businessId: selectedId,
        question,
        history,
        signal: abort.signal,
        onDelta: (delta) => {
          queueRef.current += delta;
          void pump(assistantMessage.id);
        },
      });
      while (queueRef.current.length > 0 || pumpingRef.current) {
        if (!pumpingRef.current && queueRef.current.length > 0) {
          void pump(assistantMessage.id);
        }
        await sleep(16);
      }
    } catch (error) {
      if (!abort.signal.aborted) {
        toast.error(error instanceof Error ? error.message : "AI javob bermadi");
        updateAssistant(
          assistantMessage.id,
          "Javob olinmadi. Qayta urinib ko‘ring.",
        );
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  if (businessesLoading) {
    return <p className="p-6 text-sm text-slate-500">Bizneslar yuklanmoqda...</p>;
  }

  if (!ownBusinesses.length) {
    return (
      <div className="flex h-[calc(100vh-5.5rem)] flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-semibold text-navy-900">AI tahlil</h1>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Avval o‘zingiz biznes qo‘shing. Shu biznes asosida AI bilan suhbatlashasiz.
        </p>
        <Link href="/dashboard/ideas/new" className="mt-5">
          <Button>
            <Plus className="h-4 w-4" />
            Yangi biznes
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100vh-3.5rem)] flex-col bg-[#f7f8fb] lg:-mx-8">
      <div className="border-b border-slate-200 bg-white px-4 py-3 lg:px-8">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <label className="sr-only" htmlFor="insights-business">
            Biznes
          </label>
          <select
            id="insights-business"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-navy-900 outline-none ring-navy-700 focus:ring-2"
            value={selectedId ?? ""}
            onChange={(event) => setActiveBusinessId(event.target.value)}
            disabled={streaming}
          >
            {ownBusinesses.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {CATEGORY_LABELS[item.category]} · {item.city}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full max-w-3xl flex-col px-4 py-6">
          {messages.length === 0 ? (
            <div className="m-auto w-full pb-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 text-white">
                <Bot className="h-6 w-6" />
              </div>
              <h1 className="mt-4 text-2xl font-semibold text-navy-900">
                {selected?.name} bo‘yicha savol bering
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Javob tanlangan biznes ma’lumotlari asosida yoziladi.
              </p>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 hover:border-navy-700"
                    onClick={() => void send(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {messages.map((message, index) => {
                const isLastAssistant =
                  streaming &&
                  message.role === "assistant" &&
                  index === messages.length - 1;
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    {message.role === "assistant" ? (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900 text-white">
                        <Bot className="h-4 w-4" />
                      </div>
                    ) : null}
                    <div
                      className={cn(
                        "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6",
                        message.role === "user"
                          ? "bg-navy-900 text-white"
                          : "bg-white text-slate-800 shadow-sm",
                      )}
                    >
                      {message.content
                        ? renderAnswerWithLinks(message.content)
                        : isLastAssistant
                          ? ""
                          : "..."}
                      {isLastAssistant ? (
                        <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-[2px] animate-pulse bg-navy-900" />
                      ) : null}
                    </div>
                    {message.role === "user" ? (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-navy-900">
                        <UserRound className="h-4 w-4" />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-4 lg:px-8">
        <form
          className="mx-auto flex max-w-3xl items-end gap-2 rounded-3xl border border-slate-200 bg-[#f7f8fb] px-3 py-2"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <textarea
            rows={1}
            value={input}
            placeholder={selected ? `${selected.name} haqida savol yozing...` : "Savol yozing..."}
            className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
          />
          {streaming ? (
            <Button type="button" size="icon" variant="secondary" onClick={stop}>
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" size="icon" disabled={!input.trim()}>
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
