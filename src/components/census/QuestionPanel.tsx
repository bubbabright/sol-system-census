import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUp, LoaderCircle, MessageCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Body } from "@/data/bodies";
import { askCatalogQuestion } from "@/lib/catalog-questions.functions";

export function QuestionPanel({ body }: { body: Body }) {
  const ask = useServerFn(askCatalogQuestion);
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<{ question: string; answer: string }[]>([]);
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState("");
  const [error, setError] = useState("");
  const mounted = useRef(true);
  const latest = useRef<HTMLDivElement>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { if (turns.length || pending || error) latest.current?.scrollIntoView({ block: "nearest" }); }, [turns, pending, error]);

  async function submit() {
    const text = question.trim();
    if (!text || pending) return;
    setPending(true); setSubmitted(text); setError("");
    try {
      const result = await ask({ data: { bodyId: body.id, question: text, history: turns.slice(-6) } });
      if (!mounted.current) return;
      if (result.error) setError(result.error);
      else if (result.answer) { setTurns((previous) => [...previous, { question: text, answer: result.answer }]); setQuestion(""); }
    } catch {
      if (mounted.current) setError("Couldn’t reach the astronomy guide. Please check your connection and try again.");
    } finally { if (mounted.current) setPending(false); }
  }

  return (
    <section aria-labelledby="question-heading" className="mt-6 border-t border-border pt-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="question-heading" className="flex min-w-0 items-center gap-2 font-display text-2xl"><MessageCircle className="size-4 shrink-0 text-primary" />Ask about {body.name}</h2>
        {turns.length > 0 && <Button variant="ghost" size="icon" disabled={pending} aria-label="Clear conversation" title="Clear conversation" onClick={() => { setTurns([]); setError(""); }}><Trash2 /></Button>}
      </div>
      <div role="log" aria-label={`Questions about ${body.name}`} aria-live="polite" className="space-y-5">
        {turns.map((turn, index) => <div key={index} className="pt-4">
          <p className="break-words text-sm font-medium text-primary">{turn.question}</p>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">{turn.answer}</p>
        </div>)}
        {pending && <div role="status" className="pt-4"><p className="break-words text-sm text-primary">{submitted}</p><p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />Thinking about {body.name}…</p></div>}
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      <div ref={latest}>
        <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="mt-4 flex items-end gap-2">
          <div className="min-w-0 flex-1"><label className="sr-only" htmlFor="object-question">Your question about {body.name}</label><Textarea id="object-question" value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={2000} disabled={pending} rows={2} placeholder={`What would you like to know about ${body.name}?`} className="resize-y bg-surface" /></div>
          <Button type="submit" size="icon" disabled={pending || !question.trim()} aria-label="Ask question" title="Ask question" className="shrink-0"><ArrowUp /></Button>
        </form>
        <p className="mt-2 text-[11px] text-muted-foreground">AI answer · May contain inaccuracies</p>
      </div>
    </section>
  );
}