import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign In — Brightloop",
  description: "Sign in to access your Brightloop subscription management account",
};

interface LoginPageProps {
  searchParams?: {
    redirectTo?: string;
    error?: string;
    reset?: string;
    registered?: string;
  };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const redirectTo = searchParams?.redirectTo || "";

  let initialMessage: string | undefined = undefined;
  if (searchParams?.reset === "success") {
    initialMessage =
      "Your password has been successfully updated. Please sign in with your new credentials.";
  } else if (searchParams?.registered === "true") {
    initialMessage =
      "Registration completed! You can now sign in with your email and password.";
  }

  const initialError = searchParams?.error;

  return (
    <LoginForm
      redirectTo={redirectTo}
      initialMessage={initialMessage}
      initialError={initialError}
    />
  );
}
