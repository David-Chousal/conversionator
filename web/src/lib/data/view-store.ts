import { DEFAULT_VIEW_ID, validateLayout, type BayConfig, type SavedView } from "@/lib/analytics/layout";
import { DataSourceError } from "./errors";

const MAX_NAME_LENGTH = 40;
const MAX_VIEWS = 12;

export interface ViewStore {
  list(): SavedView[];
  create(name: string, bays: BayConfig[]): SavedView;
  /** Null puts the view back on the system default layout. */
  save(id: string, bays: BayConfig[] | null): SavedView;
  remove(id: string): void;
}

function checkedLayout(bays: unknown): BayConfig[] {
  try {
    return validateLayout(bays);
  } catch (error) {
    throw new DataSourceError("invalid_input", error instanceof Error ? error.message : "That layout isn't valid.");
  }
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "view";
}

/** Saved Analytics views for the current user, in memory. */
export function createViewStore(): ViewStore {
  let views: SavedView[] = [{ id: DEFAULT_VIEW_ID, name: "Default", bays: null }];

  function find(id: string): SavedView {
    const view = views.find((entry) => entry.id === id);
    if (!view) throw new DataSourceError("not_found", "That view no longer exists. Refresh the page.");
    return view;
  }

  function checkedName(raw: string): string {
    const name = raw.trim();
    if (name.length === 0) throw new DataSourceError("invalid_input", "Give the view a name.");
    if (name.length > MAX_NAME_LENGTH) throw new DataSourceError("invalid_input", `Keep the name under ${MAX_NAME_LENGTH} characters.`);
    if (views.some((view) => view.name.toLowerCase() === name.toLowerCase())) throw new DataSourceError("invalid_input", `A view called "${name}" already exists.`);
    return name;
  }

  return {
    list: () => views,

    create(rawName, bays) {
      if (views.length >= MAX_VIEWS) throw new DataSourceError("invalid_input", `You can keep up to ${MAX_VIEWS} views. Delete one first.`);
      const name = checkedName(rawName);
      const taken = new Set(views.map((view) => view.id));
      let id = slug(name);
      for (let n = 2; taken.has(id); n += 1) id = `${slug(name)}-${n}`;
      const view = { id, name, bays: checkedLayout(bays) };
      views = [...views, view];
      return view;
    },

    save(id, bays) {
      const view = { ...find(id), bays: bays === null ? null : checkedLayout(bays) };
      views = views.map((entry) => (entry.id === id ? view : entry));
      return view;
    },

    remove(id) {
      if (id === DEFAULT_VIEW_ID) throw new DataSourceError("invalid_input", "The Default view can't be deleted. Reset it instead.");
      find(id);
      views = views.filter((entry) => entry.id !== id);
    },
  };
}
