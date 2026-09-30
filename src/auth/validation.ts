import { z } from "zod";

import { usernameSchema } from "@/src/lib/username";

const passwordSchema = z.string().min(8).max(128);
const localeSchema = z.enum(["en", "ar"]);

export const loginInputSchema = z
  .object({
    locale: localeSchema,
    username: usernameSchema,
    password: passwordSchema,
  })
  .strict();

export const signupInputSchema = loginInputSchema
  .extend({
    displayName: z
      .string()
      .trim()
      .max(120)
      .transform((value) => value || null),
    confirmPassword: passwordSchema,
  })
  .strict()
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "password_mismatch",
  });

export const anonymousInputSchema = z.object({ locale: localeSchema }).strict();

export type AuthField =
  "username" | "displayName" | "password" | "confirmPassword";

export function validationFields(error: z.ZodError): AuthField[] {
  return [
    ...new Set(
      error.issues
        .map((issue) => issue.path[0])
        .filter(
          (field): field is AuthField =>
            field === "username" ||
            field === "displayName" ||
            field === "password" ||
            field === "confirmPassword",
        ),
    ),
  ];
}
