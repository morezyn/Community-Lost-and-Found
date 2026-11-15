"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { registerSchema, type RegisterValues } from "@/lib/validators";
import { describeFirebaseError } from "@/lib/firebase/errors";
import { loginWithGoogle, registerWithEmail } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { AuthDivider } from "@/components/auth/AuthDivider";

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [registeredEmail, setRegisteredEmail] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: RegisterValues) {
    try {
      await registerWithEmail(values.displayName, values.email, values.password);
      setRegisteredEmail(values.email);
      toast.success("Account created - welcome to FindIt!");
      router.replace("/reports");
    } catch (error) {
      toast.error(describeFirebaseError(error, "Could not create your account"));
    }
  }

  async function onGoogle() {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      toast.success("Signed in with Google");
      router.replace("/reports");
    } catch (error) {
      toast.error(describeFirebaseError(error, "Google sign-in failed"));
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm text-muted-foreground">
          Join the community to report, comment, and claim found items.
        </p>
      </div>

      {registeredEmail && (
        <Alert variant="info">
          <MailCheck />
          <AlertTitle>Check your inbox</AlertTitle>
          <AlertDescription>
            We sent a verification link to {registeredEmail}. You can browse right
            away - verify to start posting.
          </AlertDescription>
        </Alert>
      )}

      <GoogleButton onClick={onGoogle} loading={googleLoading} label="Sign up with Google" />
      <AuthDivider />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            autoComplete="name"
            placeholder="Juan Dela Cruz"
            aria-invalid={Boolean(errors.displayName)}
            {...register("displayName")}
          />
          {errors.displayName && (
            <p className="text-xs text-destructive">{errors.displayName.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@school.edu"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                className="pr-10"
                aria-invalid={Boolean(errors.password)}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 right-2 flex items-center px-1 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
