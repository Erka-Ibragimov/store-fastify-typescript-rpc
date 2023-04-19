import { FastifyInstance, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { IncomingHttpHeaders } from "http";
import {
  parse,
  format,
  InvalidRequest,
  JsonRpcPayloadRequest,
} from "json-rpc-protocol";

export interface JsonRpcRequest<T> {
  params: T;
  ip: string;
  headers: IncomingHttpHeaders;
  language: string;
}

export default fp(async (fastify: FastifyInstance) => {
  fastify.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (_, body, done) => {
      try {
        done(null, parse(body));
      } catch (e: any) {
        done(e);
      }
    }
  );
  
  fastify.setErrorHandler(
    async (error: unknown, req: FastifyRequest, reply) => {
      const errorMessage = format.error(
        (req.body as JsonRpcPayloadRequest)?.id || null,
        error
      );
      fastify.log.error(error);
      reply.status(404).send(JSON.parse(errorMessage));
    }
  );

  fastify.addHook(
    "preSerialization",
    async (req: FastifyRequest, _reply, payload: any) => {
      if (payload && payload.error) {
        return payload;
      }

      if (req.method !== "POST") {
        return JSON.parse(format.error(null, new InvalidRequest()));
      }

      const id = (req.body as JsonRpcPayloadRequest)?.id;
      const responseMessage = format.response(id, payload);
      return JSON.parse(responseMessage);
    }
  );
});
