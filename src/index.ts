import fastify, { FastifyInstance, FastifyRequest } from "fastify";
import config from "./config";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import redis from "@fastify/redis";
import jsonrpc from "./plugins/jsonrpc";
import router from "./plugins/router";
import decorators from "./plugins/decorators";
import authorization from "./plugins/authorization";
import prisma from "./plugins/prisma";

declare module "fastify" {
  interface FastifyInstance {
    config: typeof config;
  }
}

const app: FastifyInstance = fastify({ logger: false });

app
  .decorate("config", config)
  .register(cors, { origin: "*", credentials: true })
  .register(multipart)
  .register(decorators)
  .register(prisma)
  .register(authorization)
  .register(jsonrpc)
  .register(redis, config.database.redis)
  .register(router);

app.post("*", async (request: FastifyRequest) => app.router(request));

const start = async () => {
  try {
    await app.listen({ port: Number(config.port), host: config.host });
    console.log(`Listening on port ${config.port}`);
  } catch (e) {
    app.log.error(e);
    process.exit(1);
  }
};
start();
