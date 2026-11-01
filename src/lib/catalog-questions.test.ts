import { describe, it as test } from "node:test";
import assert from "node:assert/strict";
import { catalogContext, questionSchema } from "./catalog-questions";

describe("catalog questions", () => {
  test("validates an actual catalog object and trims a natural-language question", () => {
    assert.deepEqual(questionSchema.parse({ bodyId: "earth", question: " Why is it blue? " }), { bodyId: "earth", question: "Why is it blue?", history: [] });
  });
  test("rejects unknown objects and empty questions", () => {
    assert.equal(questionSchema.safeParse({ bodyId: "fake-planet", question: "Why?" }).success, false);
    assert.equal(questionSchema.safeParse({ bodyId: "earth", question: "  " }).success, false);
  });
  test("grounds answers in the selected object rather than another planet", () => {
    const earth = JSON.parse(catalogContext("earth"));
    assert.equal(earth.name, "Earth");
    assert.equal(earth.diameter, "12,742 km");
    assert.equal(earth.parent, "Sun");
    assert.ok(earth.satellites.includes("Moon"));
    assert.equal(JSON.parse(catalogContext("mars")).name, "Mars");
  });
});