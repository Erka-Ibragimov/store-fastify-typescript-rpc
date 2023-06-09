import { FastifyInstance } from "fastify";
import { JsonRpcRequest } from "../plugins/jsonrpc";
import { Type, Static } from "@sinclair/typebox";
export const schema = Type.Object({});

type Params = Static<typeof schema>;
export default async (
  {}: JsonRpcRequest<Params>,
  { authorize, prisma }: FastifyInstance
) => {
  const user = await authorize();
  const likes = await prisma.like.findMany({
    where: {
      userId: user.userId,
    },
  });
  return likes;
};
