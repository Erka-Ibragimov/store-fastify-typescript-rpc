import { FastifyInstance } from "fastify";
import { JsonRpcRequest } from "../plugins/jsonrpc";
import { Static, Type } from "@sinclair/typebox";

export const schema = Type.Object({
  username: Type.Optional(Type.String()),
  password: Type.Optional(Type.String()),
  phoneNumber: Type.Optional(Type.String()),
  code: Type.Optional(Type.String()),
});

export type Params = Static<typeof schema>;

export default async ({}: JsonRpcRequest<Params>, {}: FastifyInstance) => {};
