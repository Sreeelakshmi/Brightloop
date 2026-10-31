export type UserRole = "admin" | "staff" | "customer";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  customerId?: string;
  avatarUrl?: string;
}

export const AUTH_COOKIE_NAME = "brightloop_role";
export const USER_ID_COOKIE = "brightloop_user_id";

