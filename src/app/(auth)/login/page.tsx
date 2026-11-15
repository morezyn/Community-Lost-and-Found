import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  // Only allow relative paths to avoid open-redirects.
  const redirectTo =
    typeof params.redirect === "string" && params.redirect.startsWith("/")
      ? params.redirect
      : "/reports";

  return <LoginForm redirectTo={redirectTo} />;
}
