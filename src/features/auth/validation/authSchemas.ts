import { z } from "zod";

const emailSchema = z.string().trim().email("Enter a valid email address");
const passwordSchema = z.string().min(3, "At least 3 characters");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z
  .object({
    username: z.string().trim().min(3, "At least 3 characters"),
    email: emailSchema,
    password: passwordSchema,
    confirmation: z.string().min(1, "Please confirm your password"),
    avatar: z
      .custom<File>(
        (value) => typeof File !== "undefined" && value instanceof File,
      )
      .optional()
      .refine(
        (file) =>
          !file ||
          ["image/jpeg", "image/png", "image/webp"].includes(file.type),
        {
          message: "Choose a JPG, PNG or WEBP image",
        },
      )
      .refine((file) => !file || file.size <= 2 * 1024 * 1024, {
        message: "Avatar must be 2 MB or smaller",
      }),
  })
  .refine((values) => values.password === values.confirmation, {
    message: "Passwords do not match",
    path: ["confirmation"],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
