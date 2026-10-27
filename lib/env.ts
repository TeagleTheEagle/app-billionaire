export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  authSecret: process.env.AUTH_SECRET ?? "dev-secret-change-me",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripePrices: {
    starter: process.env.STRIPE_PRICE_STARTER ?? "",
    pro: process.env.STRIPE_PRICE_PRO ?? "",
    growth: process.env.STRIPE_PRICE_GROWTH ?? "",
  },
  twilio: {
    sid: process.env.TWILIO_ACCOUNT_SID ?? "",
    token: process.env.TWILIO_AUTH_TOKEN ?? "",
    from: process.env.TWILIO_FROM_NUMBER ?? "",
  },
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "Fable <quotes@example.com>",
  trialQuoteLimit: Number(process.env.TRIAL_QUOTE_LIMIT ?? "10"),
};

export const features = {
  ai: () => Boolean(env.anthropicApiKey),
  stripe: () => Boolean(env.stripeSecretKey),
  sms: () => Boolean(env.twilio.sid && env.twilio.token && env.twilio.from),
  email: () => Boolean(env.resendApiKey),
};
