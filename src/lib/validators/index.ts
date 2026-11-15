import { z } from "zod";

import {
  MAX_DESCRIPTION_LENGTH,
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGES,
  MAX_TITLE_LENGTH,
  ACCEPTED_IMAGE_TYPES,
} from "@/lib/constants";

/* ------------------------------------------------------------------ */
/* Auth                                                               */
/* ------------------------------------------------------------------ */

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be 50 characters or fewer"),
    email: z.email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .max(72, "Firebase passwords are limited to 72 characters"),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address"),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be 50 characters or fewer"),
  photoURL: z
    .string()
    .trim()
    .max(500)
    .refine(
      (value) => value === "" || /^https?:\/\//.test(value),
      "Enter a valid http(s) image URL or leave it empty",
    ),
});

export type ProfileValues = z.infer<typeof profileSchema>;

/* ------------------------------------------------------------------ */
/* Reports                                                            */
/* ------------------------------------------------------------------ */

const VALID_IMAGE_TYPES: readonly string[] = ACCEPTED_IMAGE_TYPES;

export const reportSchema = z
  .object({
    type: z.enum(["lost", "found", "incident"]),
    title: z
      .string()
      .trim()
      .min(5, "Title must be at least 5 characters")
      .max(MAX_TITLE_LENGTH, `Title must be ${MAX_TITLE_LENGTH} characters or fewer`),
    description: z
      .string()
      .trim()
      .min(20, "Add a little more detail (at least 20 characters)")
      .max(MAX_DESCRIPTION_LENGTH, `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`),
    categoryId: z.string().optional(),
    locationText: z
      .string()
      .trim()
      .min(3, "Where did this happen or where was it last seen?")
      .max(120, "Location must be 120 characters or fewer"),
    eventDate: z
      .string()
      .min(1, "Choose the date")
      .refine((value) => !Number.isNaN(new Date(value).getTime()), "Choose a valid date")
      .refine((value) => {
        const date = new Date(value);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        return date.getTime() <= endOfToday.getTime();
      }, "The date cannot be in the future"),
    verificationQuestion: z
      .string()
      .trim()
      .max(200, "Question must be 200 characters or fewer"),
    verificationAnswer: z
      .string()
      .trim()
      .max(300, "Answer must be 300 characters or fewer"),
  })
  .superRefine((values, ctx) => {
    if (values.type === "found" && values.verificationQuestion && !values.verificationAnswer) {
      ctx.addIssue({
        code: "custom",
        path: ["verificationAnswer"],
        message: "Add the expected answer so you can verify the owner",
      });
    }
    if (values.type === "found" && !values.verificationQuestion && values.verificationAnswer) {
      ctx.addIssue({
        code: "custom",
        path: ["verificationQuestion"],
        message: "Add a verification question first",
      });
    }
  });

export type ReportSchemaValues = z.infer<typeof reportSchema>;

export const claimSchema = z
  .object({
    answer: z.string().trim().max(500, "Answer must be 500 characters or fewer"),
    proofDescription: z
      .string()
      .trim()
      .max(1000, "Proof description must be 1000 characters or fewer"),
  })
  .refine((values) => values.answer.length > 0 || values.proofDescription.length > 0, {
    message: "Describe why this item is yours, or answer the verification question",
    path: ["proofDescription"],
  });

export type ClaimSchemaValues = z.infer<typeof claimSchema>;

export const claimReviewSchema = z.object({
  reviewNote: z.string().trim().max(500).optional(),
});

export const commentSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Write a comment")
    .max(500, "Comments are limited to 500 characters"),
});

export type CommentSchemaValues = z.infer<typeof commentSchema>;

/* ------------------------------------------------------------------ */
/* Admin                                                              */
/* ------------------------------------------------------------------ */

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(40, "Name must be 40 characters or fewer"),
  appliesTo: z
    .array(z.enum(["lost", "found", "incident"]))
    .min(1, "Pick at least one report type"),
  active: z.boolean(),
});

export type CategorySchemaValues = z.infer<typeof categorySchema>;

/* ------------------------------------------------------------------ */
/* Image validation helpers (used outside react-hook-form)             */
/* ------------------------------------------------------------------ */

export function validateImageFile(file: File): string | null {
  if (!VALID_IMAGE_TYPES.includes(file.type)) {
    return "Only JPEG, PNG, and WebP images are allowed";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Each image must be 5 MB or smaller";
  }
  return null;
}

export const imageCountSchema = z
  .array(z.unknown())
  .max(MAX_IMAGES, `You can upload up to ${MAX_IMAGES} photos`);
