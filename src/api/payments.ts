import { mockHandler } from "./mockClient";
import { PaymentDeclinedError } from "@/lib/errors";

/**
 * Mock payment gateway.
 *
 * Card rules (documented on the checkout page):
 *  - 4242 4242 4242 4242  -> success
 *  - 4000 0000 0000 0002  -> declined (PaymentDeclinedError)
 *  - anything else        -> success (still validates Luhn + expiry on the form)
 *
 * A real implementation would call a PSP and never handle card data in-app.
 */

export interface CardInput {
  number: string; // raw digits
  expiryMM: string;
  expiryYY: string;
  cvv: string;
  name: string;
}

export interface PaymentRequest {
  card: CardInput;
  amount: number;
  idempotencyKey: string;
}

export interface PaymentResponse {
  transactionId: string;
  status: "succeeded";
}

export const paymentsApi = {
  async charge(req: PaymentRequest): Promise<PaymentResponse> {
    return mockHandler(() => {
      if (req.idempotencyKey.startsWith("decline_")) {
        throw new PaymentDeclinedError();
      }
      // Luhn-validate before "charging".
      const digits = req.card.number.replace(/\D/g, "");
      if (digits.length >= 12 && !luhnValid(digits)) {
        throw new PaymentDeclinedError("That card number isn't valid. Please check it and try again.");
      }
      if (digits === "4000000000000002") {
        throw new PaymentDeclinedError();
      }
      return {
        transactionId: `txn_${Math.random().toString(36).slice(2, 12)}`,
        status: "succeeded" as const,
      };
    })();
  },
};

/** Luhn checksum — used by both the form validator and the mock gateway. */
export function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}
