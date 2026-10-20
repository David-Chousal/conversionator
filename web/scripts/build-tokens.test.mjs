import { describe, expect, test } from "vitest";
import { buildTokensCss } from "./build-tokens.mjs";

const sample = {
  color: {
    themes: [{ id: "light" }, { id: "dark" }],
    tokens: [
      { name: "ink", value: { light: "#111111", dark: "#eeeeee" } },
      { name: "rail", value: { light: "{ink}", dark: "{ink}" } },
      { name: "flare", value: "#ff7700" },
    ],
  },
  shadow: { tokens: [{ name: "shadow-pop", value: { light: "0 1px 2px #000", dark: "0 2px 4px #000" } }] },
  spacing: { tokens: [{ name: "space-1", value: "4px" }] },
  zIndex: { tokens: [{ name: "z-menu", value: "50" }] },
  type: { families: { sans: "Satoshi, Arial, sans-serif" } },
};

describe("buildTokensCss", () => {
  const css = buildTokensCss(sample);

  test("declares light color values on :root", () => {
    expect(css).toMatch(/:root \{[^}]*--ink: #111111;/);
  });

  test("turns {alias} values into var() references", () => {
    expect(css).toContain("--rail: var(--ink);");
  });

  test("redefines dark values for the OS preference unless light is forced", () => {
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\) \{\s*:root:not\(\[data-theme="light"\]\) \{[^}]*--ink: #eeeeee;/);
  });

  test("redefines dark values when data-theme is dark", () => {
    expect(css).toMatch(/:root\[data-theme="dark"\] \{[^}]*--shadow-pop: 0 2px 4px #000;/);
  });

  test("uses a plain string color for every theme", () => {
    expect(css).toMatch(/:root\[data-theme="dark"\] \{[^}]*--flare: #ff7700;/);
  });

  test("emits non-color families once on :root", () => {
    expect(css).toContain("--space-1: 4px;");
    expect(css).toContain("--z-menu: 50;");
  });

  test("puts the next/font face variable in front of each family stack", () => {
    expect(css).toContain("--font-sans: var(--font-sans-face), Satoshi, Arial, sans-serif;");
  });
});
