import { FastifyInstance } from "fastify";
import { JsonRpcRequest } from "../plugins/jsonrpc";
import { Type, Static } from "@sinclair/typebox";
import { JsonRpcError } from "json-rpc-protocol";
export const schema = Type.Object({
  staticId: Type.Integer(),
});

type Params = Static<typeof schema>;
export default async (
  { params }: JsonRpcRequest<Params>,
  { authorize, prisma }: FastifyInstance
) => {
  const user = await authorize();
  if (!user) {
    throw new JsonRpcError("Пользователь не найден");
  }
  const like = await prisma.like.findFirst({
    where: {
      userId: user.userId,
      staticId: params.staticId,
    },
  });
  if (!like) {
    throw new JsonRpcError("Товар не найден");
  }
  const result = await prisma.like.delete({
    where: {
      id: like.id,
    },
  });
  return result;
};
