import { z } from "zod";
import { BODIES } from "@/data/bodies";

export const questionSchema = z.object({
  bodyId: z.string().refine((id) => BODIES.some((body) => body.id === id), "Unknown catalog object"),
  question: z.string().trim().min(1).max(2000),
  history: z.array(z.object({ question: z.string().max(2000), answer: z.string().max(12000) })).max(6).default([]),
});

export function catalogContext(bodyId: string) {
  const body = BODIES.find((item) => item.id === bodyId);
  if (!body) throw new Error("Unknown catalog object");
  const parent = BODIES.find((item) => item.id === body.parent);
  return JSON.stringify({
    name: body.name, type: body.type, mass: body.mass, diameter: body.diameter,
    orbit: body.orbit, discovered: body.discovered, summary: body.tldr,
    parent: parent?.name ?? body.parent,
    satellites: BODIES.filter((item) => item.parent === bodyId).map((item) => item.name),
  });
}