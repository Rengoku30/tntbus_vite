import { z } from "zod";
import { luhnValid } from "@/api/payments";

/**
 * Zod validation schemas (L3). Every form is validated here — typed errors,
 * human-friendly messages, and complex cross-field rules via .refine/superRefine.
 */

const emailSchema = z
  .string({ error: "Enter your email address" })
  .trim()
  .toLowerCase()
  .email("Enter a valid email address");

const passwordSchema = z
  .string({ error: "Enter a password" })
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[0-9]/, "Include at least one number");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ error: "Enter your password" }).min(1, "Enter your password"),
});

export const registerSchema = z
  .object({
    name: z
      .string({ error: "Enter your full name" })
      .trim()
      .min(2, "Enter your full name"),
    email: emailSchema,
    phone: z
      .string({ error: "Enter your phone number" })
      .trim()
      .regex(/^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number"),
    password: passwordSchema,
    confirmPassword: z.string({ error: "Confirm your password" }),
    terms: z
      .boolean({ error: "You must accept the terms to continue" })
      .refine((v) => v === true, { message: "You must accept the terms to continue", path: ["terms"] }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const searchSchema = z
  .object({
    origin: z.string({ error: "Choose an origin" }).min(2, "Choose an origin"),
    destination: z.string({ error: "Choose a destination" }).min(2, "Choose a destination"),
    date: z.string({ error: "Choose a travel date" }).min(1, "Choose a travel date"),
    passengers: z.number().int().min(1).max(9),
  })
  .refine((v) => v.origin.toLowerCase() !== v.destination.toLowerCase(), {
    message: "Origin and destination can't be the same",
    path: ["destination"],
  })
  .refine((v) => v.date >= todayIso(), {
    message: "Travel date can't be in the past",
    path: ["date"],
  });

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export interface CheckoutValues {
  passengerName: string;
  contactEmail: string;
  contactPhone?: string;
  cardName: string;
  cardNumber: string; // digits only
  expiry: string; // MM/YY
  cvv: string;
}

export const checkoutSchema = z
  .object({
    passengerName: z
      .string({ error: "Enter the passenger name" })
      .trim()
      .min(2, "Enter the passenger name"),
    contactEmail: emailSchema,
    contactPhone: z
      .string()
      .trim()
      .regex(/^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number")
      .optional()
      .or(z.literal("")),
    cardName: z
      .string({ error: "Enter the name on the card" })
      .trim()
      .min(2, "Enter the name on the card"),
    cardNumber: z
      .string({ error: "Enter your card number" })
      .regex(/^\d{13,19}$/, "Enter a valid card number"),
    expiry: z
      .string({ error: "Enter the expiry date" })
      .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Use MM/YY format"),
    cvv: z
      .string({ error: "Enter the CVV" })
      .regex(/^\d{3,4}$/, "Enter a valid CVV"),
  })
  .superRefine((v, ctx) => {
    // Luhn check on card number.
    if (v.cardNumber && !luhnValid(v.cardNumber)) {
      ctx.addIssue({
        code: "custom",
        path: ["cardNumber"],
        message: "This card number isn't valid",
      });
    }
    // Expiry must be in the future.
    const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(v.expiry);
    if (m) {
      const month = Number(m[1]);
      const year = 2000 + Number(m[2]);
      const now = new Date();
      const exp = new Date(year, month, 0, 23, 59, 59);
      if (exp.getTime() < now.getTime()) {
        ctx.addIssue({
          code: "custom",
          path: ["expiry"],
          message: "This card has expired",
        });
      }
    }
  });

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
export type SearchForm = z.infer<typeof searchSchema>;
export type CheckoutForm = z.infer<typeof checkoutSchema>;
