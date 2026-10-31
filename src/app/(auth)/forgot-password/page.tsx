import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "Forgot Password — Brightloop",
  description: "Request a password reset link for your Brightloop account",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
