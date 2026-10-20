import type { Role } from "./types";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  initials: string;
  lastActiveAt: string | null;
}

export interface Invite {
  id: string;
  email: string;
  role: Role;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
}

export interface InviteProblem {
  email: string;
  reason: string;
}
