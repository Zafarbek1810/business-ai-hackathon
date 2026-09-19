"use client";

import { useState } from "react";
import { aiApi } from "@/services/radar";
import { renderAnswerWithLinks } from "@/components/ai/render-answer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function CopilotPanel({ businessId }: { businessId: string }) {
  const [question, setQuestion] = useState("Nega zararsizlik nuqtam yuqori?");
  const [answer, setAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<string[]>([]);
  const [provider, setProvider] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [loading, setLoading] = useState(false);

  async function ask() {
    setLoading(true);
    try {
      const result = await aiApi.copilot(businessId, question);
      setAnswer(result.answer);
      setCitations(result.citations);
      setProvider(result.provider);
      setUsedFallback(result.usedFallback);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI javob bermadi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI yordamchi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-500">
          Bu chatbot emas. Javob faqat joriy Biznes Radar kontekstiga tayanadi.
        </p>
        <Input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void ask();
            }
          }}
        />
        <Button type="button" variant="accent" onClick={() => void ask()} disabled={loading}>
          {loading ? "Tahlil..." : "So‘rash"}
        </Button>
        {answer ? (
          <div className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
            {renderAnswerWithLinks(answer)}
            <ul className="mt-3 space-y-1 text-xs text-slate-500">
              {citations.map((item) => (
                <li key={item}>Asos: {item}</li>
              ))}
            </ul>
            {provider ? (
              <p className="mt-2 text-xs text-slate-400">
                Provider: {provider}
                {usedFallback ? " (fallback)" : ""}
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
