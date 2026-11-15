"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validators";
import { describeFirebaseError } from "@/lib/firebase/errors";
import { requestPasswordReset } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordValues) {
    try {
      await requestPasswordReset(values.email);
      setSentTo(values.email);
      toast.success("Password reset email sent");
    } catch (error) {
      toast.error(describeFirebaseError(error, "Could not send reset email"));
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          Enter the email on your account and we&apos;ll send a reset link.
        </p>
      </div>

      {sentTo ? (
        <Alert variant="success">
          <MailCheck />
          <AlertTitle>Check your inbox</AlertTitle>
          <AlertDescription>
            A reset link is on its way to {sentTo}. It expires in one hour.
          </AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Send reset link
          </Button>
        </form>
      )}

      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="size-4" /> Back to sign in
      </Link>
    </div>
  );
}
