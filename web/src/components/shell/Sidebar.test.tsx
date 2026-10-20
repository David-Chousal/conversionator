import { beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "./Sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/connections",
  useRouter: () => ({ push: vi.fn() }),
}));

const user = { id: "u1", name: "David Chousal", email: "dchousal@northwind.co", role: "admin" as const, initials: "DC" };

describe("Sidebar", () => {
  beforeEach(() => {
    render(<Sidebar workspaceName="Northwind" user={user} />);
  });

  test("lists the six destinations in order", () => {
    const main = screen.getByRole("navigation", { name: "Main" });
    const names = [...main.querySelectorAll(".cor-nav a")].map((a) => a.textContent?.replace(/G .$/, ""));
    expect(names).toEqual(["Analytics", "Connections", "Data", "Reports", "Team", "Settings"]);
  });

  test("marks the current page", () => {
    const current = screen.getByRole("navigation", { name: "Main" }).querySelector('[aria-current="page"]');
    expect(current?.textContent).toContain("Connections");
  });

  test("shows the workspace and the signed-in user", () => {
    expect(screen.getByText("Northwind")).toBeDefined();
    expect(screen.getByText("David Chousal")).toBeDefined();
  });
});
