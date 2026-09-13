/**
 * Where students send the money. Set these in `.env` — they are read on the
 * server and handed to the purchase popup as props, so they never need the
 * NEXT_PUBLIC_ prefix.
 *
 *   VODAFONE_CASH_NUMBER=01xxxxxxxxx
 *   INSTAPAY_NUMBER=01xxxxxxxxx
 *   SUPPORT_PHONE=01xxxxxxxxx        # where the receipt screenshot goes
 *   INSTAPAY_HANDLE=name@instapay    # optional
 */
export interface PaymentInfo {
  vodafoneCash: string;
  instapay: string;
  instapayHandle: string | null;
  /** The WhatsApp number the transfer screenshot is sent to. */
  support: string;
}

const FALLBACK = "01000000000";

/** An unset key and an empty one mean the same thing here. */
const env = (name: string) => {
  const value = process.env[name]?.trim();
  return value ? value : null;
};

export const getPaymentInfo = (): PaymentInfo => {
  const wallet = env("VODAFONE_CASH_NUMBER") ?? FALLBACK;

  return {
    vodafoneCash: wallet,
    instapay: env("INSTAPAY_NUMBER") ?? wallet,
    instapayHandle: env("INSTAPAY_HANDLE"),
    support: env("SUPPORT_PHONE") ?? wallet,
  };
};

/** 01012345678 -> 201012345678, the form wa.me expects. */
export const whatsappLink = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  const international = digits.startsWith("0") ? `20${digits.slice(1)}` : digits;
  return `https://wa.me/${international}`;
};
