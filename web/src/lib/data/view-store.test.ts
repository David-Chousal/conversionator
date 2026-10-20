import { beforeEach, describe, expect, test } from "vitest";
import { systemDefault } from "@/lib/analytics/layout";
import { DataSourceError } from "./errors";
import { createViewStore, type ViewStore } from "./view-store";

const layout = systemDefault("crm");

describe("view store", () => {
  let views: ViewStore;

  beforeEach(() => {
    views = createViewStore();
  });

  test("starts with a Default view that follows the system layout", () => {
    expect(views.list()).toEqual([{ id: "default", name: "Default", bays: null }]);
  });

  test("creates a named view with its own layout", () => {
    const growth = views.create("Growth", layout.slice(0, 2));
    expect(growth).toMatchObject({ id: "growth", name: "Growth" });
    expect(views.list().map((view) => view.name)).toEqual(["Default", "Growth"]);
  });

  test("trims names and rejects empty, long or duplicate ones", () => {
    expect(views.create("  Paid social  ", layout).name).toBe("Paid social");
    expect(() => views.create("   ", layout)).toThrowError(DataSourceError);
    expect(() => views.create("x".repeat(41), layout)).toThrowError(/40 characters/);
    expect(() => views.create("default", layout)).toThrowError(/already/);
  });

  test("saves a layout over a view, including the Default view", () => {
    views.save("default", layout.slice(0, 3));
    expect(views.list()[0].bays).toHaveLength(3);
  });

  test("puts the Default view back on the system layout when saved with none", () => {
    views.save("default", layout.slice(0, 3));
    views.save("default", null);
    expect(views.list()[0].bays).toBeNull();
  });

  test("validates layouts it is given", () => {
    expect(() => views.save("default", [{ id: "x", kind: "pie", span: 6 }] as never)).toThrowError(DataSourceError);
  });

  test("deletes a view but never the Default one", () => {
    const growth = views.create("Growth", layout);
    views.remove(growth.id);
    expect(views.list()).toHaveLength(1);
    expect(() => views.remove("default")).toThrowError(/Default/);
  });

  test("errors for an unknown view", () => {
    expect(() => views.save("nope", layout)).toThrowError(DataSourceError);
  });
});
