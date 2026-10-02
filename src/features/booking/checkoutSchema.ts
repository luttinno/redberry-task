import { z } from "zod";

function isFutureExpiry(value: string) {
  const [monthText, yearText] = value.split("/");
  const month = Number(monthText);
  const year = 2000 + Number(yearText);
  const now = new Date();
  return (
    year > now.getFullYear() ||
    (year === now.getFullYear() && month >= now.getMonth() + 1)
  );
}

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(3, "Enter your full name").max(50),
  email: z.email("Enter a valid email address"),
  mobileNumber: z
    .string()
    .refine(
      (value) => /^5\d{8}$/.test(value.replace(/\s/g, "")),
      "Use a Georgian mobile number: 5XXXXXXXX",
    ),
  cardNumber: z
    .string()
    .refine(
      (value) =>
        /^[\d ]+$/.test(value) && value.replace(/\D/g, "").length === 16,
      "Enter 16 digits",
    ),
  expiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Use MM/YY")
    .refine(isFutureExpiry, "Expiry must be in the future"),
  cvv: z.string().regex(/^\d{3}$/, "Enter 3 digits"),
});

export type CheckoutValues = z.infer<typeof checkoutSchema>;
