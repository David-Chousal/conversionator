// Generates src/styles/tokens.css from the design system's tokens.json.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(here, "../../design-system/project/tokens.json");
const TARGET = resolve(here, "../src/styles/tokens.css");
const THEMED_FAMILIES = ["color", "shadow"];
const PLAIN_FAMILIES = ["spacing", "radius", "size", "zIndex"];

function resolveValue(value) {
  const alias = /^\{(.+)\}$/.exec(value);
  return alias ? `var(--${alias[1]})` : value;
}

function valueFor(token, themeId, firstThemeId) {
  if (typeof token.value === "string") return resolveValue(token.value);
  return resolveValue(token.value[themeId] ?? token.value[firstThemeId]);
}

function themedDeclarations(tokens, themeId, firstThemeId) {
  return THEMED_FAMILIES.flatMap((family) =>
    (tokens[family]?.tokens ?? []).map((token) => `  --${token.name}: ${valueFor(token, themeId, firstThemeId)};`),
  );
}

function plainDeclarations(tokens) {
  const sizes = PLAIN_FAMILIES.flatMap((family) =>
    (tokens[family]?.tokens ?? []).map((token) => `  --${token.name}: ${token.value};`),
  );
  const fonts = Object.entries(tokens.type?.families ?? {}).map(
    ([key, stack]) => `  --font-${key}: var(--font-${key}-face), ${stack};`,
  );
  return [...sizes, ...fonts];
}

export function buildTokensCss(tokens) {
  const themes = tokens.color.themes;
  const firstId = themes[0].id;
  const darkId = themes.find((theme) => theme.id === "dark")?.id ?? firstId;
  const light = themedDeclarations(tokens, firstId, firstId);
  const dark = themedDeclarations(tokens, darkId, firstId);
  const darkBlock = ["  color-scheme: dark;", ...dark].join("\n");

  return [
    "/* Generated from design-system/project/tokens.json by `npm run tokens`. Do not edit by hand. */",
    `:root {\n  color-scheme: light;\n${[...light, ...plainDeclarations(tokens)].join("\n")}\n}`,
    `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n${darkBlock.replace(/^/gm, "  ")}\n  }\n}`,
    `:root[data-theme="dark"] {\n${darkBlock}\n}`,
    "",
  ].join("\n\n");
}

function main() {
  const tokens = JSON.parse(readFileSync(SOURCE, "utf8"));
  writeFileSync(TARGET, buildTokensCss(tokens));
  process.stdout.write(`Wrote ${TARGET}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
