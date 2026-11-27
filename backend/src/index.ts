import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { fromNodeHeaders } from "better-auth/node";
import { auth, authEmailDeliveryEnabled } from "./lib/auth";
import { prisma } from "./lib/prisma";

const app = Fastify({ logger: true });
const port = Number(process.env.PORT ?? 3001);
const emailNotVerified = () => ({ error: "EMAIL_NOT_VERIFIED" });
const getSession = (headers: Parameters<typeof fromNodeHeaders>[0]) =>
  auth.api.getSession({ headers: fromNodeHeaders(headers) });
const isEmailVerified = async (headers: Parameters<typeof fromNodeHeaders>[0]) => {
  if (!authEmailDeliveryEnabled) return true;
  const session = await getSession(headers);
  return !session || session.user.emailVerified;
};

await app.register(cors, {
  origin: [process.env.CLIENT_ORIGIN ?? "http://localhost:8081"],
  credentials: true,
});
await app.register(websocket);

// Sonde de sante: verifie reellement la connexion a PostgreSQL.
app.get("/api/health", async () => {
  await prisma.$queryRaw`SELECT 1`;
  return { status: "ok", database: "connected", app: "ColocSync" };
});

// Expose only whether an OAuth provider is configured, never its credentials.
app.get("/api/auth/providers", async () => ({
  google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  apple: Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET),
  facebook: Boolean(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET),
}));

app.get("/api/auth/config", async () => ({ emailDeliveryEnabled: authEmailDeliveryEnabled }));

// La route est volontairement ouverte pour tester la connexion WS.
// Les futurs evenements de colocation devront verifier la session et les permissions.
app.get("/ws", { websocket: true }, async (socket, request) => {
  if (!(await isEmailVerified(request.headers))) {
    socket.close(1008, "EMAIL_NOT_VERIFIED");
    return;
  }
  socket.send(JSON.stringify({ type: "connected", app: "ColocSync" }));
  socket.on("message", (data) => {
    if (data.toString() === "ping") socket.send("pong");
  });
});

// Better Auth : inscription/connexion/sessions sont servies ici.
app.route({
  method: ["GET", "POST"],
  url: "/api/auth/*",
  async handler(request, reply) {
    if (authEmailDeliveryEnabled) {
      const urlPath = new URL(request.url, `http://${request.headers.host ?? `localhost:${port}`}`).pathname;
      const allowed = new Set([
        "GET /api/auth/get-session", "POST /api/auth/get-session",
        "GET /api/auth/verify-email", "POST /api/auth/send-verification-email",
        "POST /api/auth/sign-out",
      ]);
      if (!allowed.has(`${request.method} ${urlPath}`) && !(await isEmailVerified(request.headers))) {
        return reply.code(403).send(emailNotVerified());
      }
    }
    const host = request.headers.host ?? `localhost:${port}`;
    const url = new URL(request.url, `http://${host}`);
    const headers = fromNodeHeaders(request.headers);
    const authRequest = new Request(url, {
      method: request.method,
      headers,
      ...(request.method !== "GET" && request.method !== "HEAD"
        ? { body: request.body === undefined ? undefined : JSON.stringify(request.body) }
        : {}),
    });
    const response = await auth.handler(authRequest);
    reply.status(response.status);
    response.headers.forEach((value, key) => {
      if (key !== "set-cookie") reply.header(key, value);
    });
    const cookies = response.headers.getSetCookie?.() ?? [];
    if (cookies.length) reply.header("set-cookie", cookies);
    return reply.send(await response.text());
  },
});

app.get("/api/me", async (request, reply) => {
  const session = await getSession(request.headers);
  if (!session) return reply.code(401).send({ error: "Non authentifie" });
  if (authEmailDeliveryEnabled && !session.user.emailVerified) return reply.code(403).send(emailNotVerified());
  return session;
});

app.addHook("onClose", async () => {
  await prisma.$disconnect();
});

try {
  await app.listen({ host: "0.0.0.0", port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
