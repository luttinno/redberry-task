import { z } from "zod";

const mobileNumberSchema = z
  .string()
  .transform((value) => value.replace(/\s+/g, ""))
  .pipe(
    z.string().superRefine((value, context) => {
      if (!value) {
        context.addIssue({
          code: "custom",
          message: "Mobile number is required",
        });
      } else if (!/^\d+$/.test(value)) {
        context.addIssue({
          code: "custom",
          message:
            "Please enter a valid Georgian mobile number (9 digits starting with 5)",
        });
      } else if (!value.startsWith("5")) {
        context.addIssue({
          code: "custom",
          message: "Georgian mobile numbers must start with 5",
        });
      } else if (value.length !== 9) {
        context.addIssue({
          code: "custom",
          message: "Mobile number must be exactly 9 digits",
        });
      }
    }),
  );

const dateOfBirthSchema = z.string().superRefine((value, context) => {
  if (!value) {
    context.addIssue({ code: "custom", message: "Date of birth is required" });
    return;
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime()) || date > new Date()) {
    context.addIssue({
      code: "custom",
      message: "Please enter a valid date of birth",
    });
    return;
  }

  const minimumDate = new Date();
  minimumDate.setHours(0, 0, 0, 0);
  minimumDate.setFullYear(minimumDate.getFullYear() - 12);
  if (date > minimumDate) {
    context.addIssue({
      code: "custom",
      message: "You must be at least 12 years old to create an account",
    });
  }
});

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .superRefine((value, context) => {
      if (!value) {
        context.addIssue({ code: "custom", message: "Name is required" });
      } else if (value.length < 3) {
        context.addIssue({
          code: "custom",
          message: "Name must be at least 3 characters",
        });
      } else if (value.length > 50) {
        context.addIssue({
          code: "custom",
          message: "Name must not exceed 50 characters",
        });
      }
    }),
  mobileNumber: mobileNumberSchema,
  dateOfBirth: dateOfBirthSchema,
  preferredVenueId: z.string(),
});

export type ProfileFormValues = z.input<typeof profileSchema>;
export type ProfileSubmission = z.output<typeof profileSchema>;
