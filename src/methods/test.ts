import { Type, Static } from "@sinclair/typebox";
import { JsonRpcRequest } from "../plugins/jsonrpc";
import { FastifyInstance } from "fastify";
import * as jwt from "jsonwebtoken";
import { addSeconds } from "date-fns";

export const schema = Type.Object({
  id: Type.String(),
  name: Type.String(),
});

type Params = Static<typeof schema>;

export default async (
  { params }: JsonRpcRequest<Params>,
  { config, authorize }: FastifyInstance
) => {
  const user = await authorize();
  return user;
  return { test: "TEST", params };
};
