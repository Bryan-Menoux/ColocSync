const http = require("node:http");

const upstreamOrigin = "http://localhost:5556";
const server = http.createServer((clientRequest, clientResponse) => {
  const headers = { ...clientRequest.headers, host: "localhost:5556" };
  if (headers.origin) headers.origin = upstreamOrigin;
  if (headers.referer) headers.referer = `${upstreamOrigin}/`;

  const upstreamRequest = http.request({
    hostname: "127.0.0.1",
    port: 5556,
    path: clientRequest.url,
    method: clientRequest.method,
    headers,
  }, (upstreamResponse) => {
    clientResponse.writeHead(upstreamResponse.statusCode, upstreamResponse.headers);
    upstreamResponse.pipe(clientResponse);
  });

  upstreamRequest.on("error", () => {
    if (!clientResponse.headersSent) clientResponse.writeHead(502);
    clientResponse.end("Prisma Studio is unavailable");
  });
  clientRequest.pipe(upstreamRequest);
});
server.listen(5555, "0.0.0.0");
