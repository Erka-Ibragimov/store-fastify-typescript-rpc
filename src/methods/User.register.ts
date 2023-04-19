import { Static, Type } from "@sinclair/typebox";
import { JsonRpcRequest } from "../plugins/jsonrpc";
import { FastifyInstance } from "fastify";

export const schema = Type.Object({
  name: Type.String(),
  surname: Type.Optional(Type.String()),
  username: Type.Optional(Type.String()),
  password: Type.Optional(Type.String()),
  phoneNumber: Type.Optional(Type.String()),
  code: Type.Optional(Type.String()),
});

export type Params = Static<typeof schema>;

export default async (
  {}: JsonRpcRequest<Params>,
  { config }: FastifyInstance
) => {};
