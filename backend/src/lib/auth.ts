import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { expo } from "@better-auth/expo";
import { Resend } from "resend";
import { prisma } from "./prisma";

const authSecret = process.env.BETTER_AUTH_SECRET;
export const authEmailDeliveryEnabled = process.env.AUTH_EMAILS_ENABLED === "true";
if (process.env.NODE_ENV === "production" && !authSecret) {
  throw new Error("BETTER_AUTH_SECRET est obligatoire en production");
}
if (authEmailDeliveryEnabled && (!process.env.RESEND_API_KEY || !process.env.AUTH_EMAIL_FROM)) {
  throw new Error("AUTH_EMAILS_ENABLED=true exige RESEND_API_KEY et AUTH_EMAIL_FROM");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

async function sendAuthEmail({ to, subject, intro, action, url, outro }: {
  to: string;
  subject: string;
  intro: string;
  action: string;
  url: string;
  outro: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  if (!apiKey || !from) throw new Error("RESEND_API_KEY et AUTH_EMAIL_FROM sont requis pour envoyer les e-mails d’authentification");

  const safeUrl = escapeHtml(url);
  const { error } = await new Resend(apiKey).emails.send({
    from,
    to,
    subject,
    html: `<p>${intro}</p><p><a href="${safeUrl}">${action}</a></p><p>${outro}</p>`,
    text: `${intro}\n\n${action} :\n${url}\n\n${outro}`,
  });
  if (error) throw new Error("Resend n’a pas pu envoyer l’e-mail d’authentification");
}

const googleId = process.env.GOOGLE_CLIENT_ID;
const googleSecret = process.env.GOOGLE_CLIENT_SECRET;
const appleId = process.env.APPLE_CLIENT_ID;
const appleSecret = process.env.APPLE_CLIENT_SECRET;
const facebookId = process.env.FACEBOOK_CLIENT_ID;
const facebookSecret = process.env.FACEBOOK_CLIENT_SECRET;

export const auth = betterAuth({
  appName: "ColocSync",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
  secret: authSecret,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: authEmailDeliveryEnabled,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      return sendAuthEmail({
        to: user.email,
        subject: "Réinitialisez votre mot de passe — ColocSync",
        intro: "Vous avez demandé à créer un nouveau mot de passe pour votre compte ColocSync.",
        action: "Choisir un nouveau mot de passe",
        url,
        outro: "Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.",
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      if (!authEmailDeliveryEnabled) throw new Error("Les e-mails d’authentification sont désactivés");
      return sendAuthEmail({
        to: user.email,
        subject: "Confirmez votre adresse e-mail — ColocSync",
        intro: "Encore une étape avant de rejoindre ColocSync : confirmez votre adresse e-mail.",
        action: "Confirmer mon adresse e-mail",
        url,
        outro: "Si vous n’êtes pas à l’origine de cette inscription, ignorez ce message.",
      });
    },
    sendOnSignUp: authEmailDeliveryEnabled,
    sendOnSignIn: authEmailDeliveryEnabled,
    autoSignInAfterVerification: true,
    expiresIn: 3600,
  },
  plugins: [expo()],
  trustedOrigins: [
    "colocsync://",
    "colocsync://*",
    process.env.CLIENT_ORIGIN ?? "http://localhost:8081",
    ...(process.env.NODE_ENV === "development" ? ["exp://", "exp://**"] : []),
  ],
  rateLimit: {
    enabled: true,
    customRules: {
      "/send-verification-email": { window: 60, max: 1 },
      "/request-password-reset": { window: 60, max: 1 },
    },
  },
  socialProviders: {
    ...(googleId && googleSecret ? { google: { clientId: googleId, clientSecret: googleSecret } } : {}),
    ...(appleId && appleSecret ? { apple: { clientId: appleId, clientSecret: appleSecret } } : {}),
    ...(facebookId && facebookSecret ? { facebook: { clientId: facebookId, clientSecret: facebookSecret } } : {}),
  },
});
