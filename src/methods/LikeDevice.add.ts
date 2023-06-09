import { FastifyInstance } from "fastify";
import { JsonRpcRequest } from "../plugins/jsonrpc";
import { Type, Static } from "@sinclair/typebox";
export const schema = Type.Object({
  name: Type.String(),
  price: Type.String(),
  rate: Type.Optional(Type.Integer()),
  staticId: Type.Integer(),
  pathImage: Type.String(),
  type: Type.Optional(Type.String()),
  brand: Type.Optional(Type.String()),
  isActiveLike: Type.Optional(Type.Boolean()),
});

type Params = Static<typeof schema>;
export default async (
  { params }: JsonRpcRequest<Params>,
  { authorize, prisma }: FastifyInstance
) => {
  const user = await authorize();
  const like = await prisma.like.create({
    data: {
      ...params,
      user: { connect: { id: user.userId } },
    },
  });
  return like;
};
