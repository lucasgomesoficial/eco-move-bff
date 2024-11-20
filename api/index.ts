import Fastify from "fastify";
import cors from "@fastify/cors";
import AssistantV2 from "ibm-watson/assistant/v2";
import { IamAuthenticator } from "ibm-watson/auth";

const server = Fastify({
  logger: true,
});

server.register(cors, {
  origin: "*",
});

// Initialize Watson Assistant
const assistant = new AssistantV2({
  version: "2021-06-14",
  authenticator: new IamAuthenticator({
    apikey: process.env.WATSON_API_KEY!,
  }),
  serviceUrl: process.env.WATSON_URL,
  disableSslVerification: true,
});

// Create session endpoint
server.post("/api/watson/session", async (request, reply) => {
  try {
    const session = await assistant.createSession({
      assistantId: process.env.WATSON_ASSISTANT_ID!,
    });
    return { session_id: session.result.session_id };
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: "Failed to create session" });
  }
});

// Message endpoint
server.post("/api/watson/message", async (request, reply) => {
  const { sessionId, message } = request.body as {
    sessionId: string;
    message: string;
  };

  if (!sessionId || !message) {
    return reply.status(400).send({ error: "Missing required parameters" });
  }

  try {
    const response = await assistant.message({
      assistantId: process.env.WATSON_ASSISTANT_ID!,
      sessionId,
      input: {
        message_type: "text",
        text: message,
      },
    });
    return response.result.output.generic;
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: "Failed to process message" });
  }
});

server.listen(
  { port: Number(process.env.PORT), host: "0.0.0.0" },
  (err, address) => {
    if (err) {
      server.log.error(err);
      process.exit(1);
    }

    console.log(`Server listening at ${address}`);
  }
);
