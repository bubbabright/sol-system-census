import { describe, expect, test } from "bun:test";
import { catalogContext, questionSchema } from "./catalog-questions";

describe("catalog questions", () => {
  test("validates an actual catalog object and trims a natural-language question", () => {
    expect(questionSchema.parse({ bodyId: "earth", question: " Why is it blue? " })).toEqual({ bodyId: "earth", question: "Why is it blue?", history: [] });
  });
  test("rejects unknown objects and empty questions", () => {
    expect(questionSchema.safeParse({ bodyId: "fake-planet", question: "Why?" }).success).toBe(false);
    expect(questionSchema.safeParse({ bodyId: "earth", question: "  " }).success).toBe(false);
  });
  test("grounds answers in the selected object rather than another planet", () => {
    const earth = JSON.parse(catalogContext("earth"));
    expect(earth.name).toBe("Earth");
    expect(earth.diameter).toBe("12,742 km");
    expect(earth.parent).toBe("Sun");
    expect(earth.satellites).toContain("Moon");
    expect(JSON.parse(catalogContext("mars")).name).toBe("Mars");
  });
});