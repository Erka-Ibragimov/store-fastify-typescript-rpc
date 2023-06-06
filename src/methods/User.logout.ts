import { Type, Static } from "@sinclair/typebox";
import { FastifyInstance } from "fastify";
import { JsonRpcRequest } from "../plugins/jsonrpc";
export const schema = Type.Object({});

export type Params = Static<typeof schema>;
export default async (
  {}: JsonRpcRequest<Params>,
  { logout }: FastifyInstance
) => {
  const result = await logout();
  return result;
};
