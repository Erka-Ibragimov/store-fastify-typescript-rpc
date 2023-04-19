import { Type, Static } from "@sinclair/typebox";
import { JsonRpcRequest } from "../plugins/jsonrpc";
import { FastifyInstance } from "fastify";

export const schema = Type.Object({
  id: Type.String(),
  name: Type.String(),
});

type Params = Static<typeof schema>;

export default async (
  { params }: JsonRpcRequest<Params>,
  { config }: FastifyInstance
) => {
  return { test: "TEST", params };
};
