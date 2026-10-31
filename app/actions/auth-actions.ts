"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signup, login, logout, requestPasswordReset, resetPassword, validatePassword } from "@/lib/services/auth";
import { createStaff, updateStaffStatus, listStaff } from "@/lib/services/users";
import { getCurrentUser } from "@/lib/auth";

export async function handleSignup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;
  const company = formData.get("company") as string;

  try {
    await signup({ email, password, name, company });
  } catch (err: any) {
    return { error: err.message || "Failed to create account." };
  }

  redirect("/portal");
}

export async function handleLogin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTarget = (formData.get("redirect") as string) || "";

  let user;
  try {
    user = await login({ email, password });
  } catch (err: any) {
    return { error: err.message || "Invalid credentials." };
  }

  if (redirectTarget && redirectTarget.startsWith("/")) {
    redirect(redirectTarget);
  }

  if (user.role === "customer") {
    redirect("/portal");
  } else {
    redirect("/dashboard");
  }
}

export async function handleLogout() {
  await logout();
  redirect("/login");
}

export async function handleForgotPassword(formData: FormData) {
  const email = formData.get("email") as string;
  try {
    const result = await requestPasswordReset(email);
    return { success: true, message: result.message, devMailboxUrl: result.devMailboxUrl };
  } catch (err: any) {
    return { error: err.message || "Failed to request password reset." };
  }
}

export async function handleResetPassword(formData: FormData) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;

  try {
    await resetPassword(token, password);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to reset password." };
  }
}

export async function handleCreateStaff(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const temporaryPassword = formData.get("temporaryPassword") as string;

  try {
    const admin = await getCurrentUser();
    await createStaff({ name, email, temporaryPassword }, admin);
    revalidatePath("/staff");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to add staff member." };
  }
}

export async function handleToggleStaffStatus(staffId: string, nextStatus: "active" | "inactive") {
  try {
    const admin = await getCurrentUser();
    await updateStaffStatus(staffId, nextStatus, admin);
    revalidatePath("/staff");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to update staff status." };
  }
}

