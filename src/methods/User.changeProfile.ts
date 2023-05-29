import { FastifyInstance } from "fastify";
import { JsonRpcRequest } from "../plugins/jsonrpc";
import { Type, Static } from "@sinclair/typebox";
import { JsonRpcError } from "json-rpc-protocol";

export const schema = Type.Object({
  name: Type.Optional(Type.String()),
  surname: Type.Optional(Type.String()),
});

type Params = Static<typeof schema>;

export default async ({ params }: JsonRpcRequest<Params>, { config, authorize, prisma }: FastifyInstance) => {
  const user = await authorize();

  const newProfile = await prisma.user.update({
    where: {
      id: user.userId,
    },
    data: {
      name: params.name,
      surname: params.surname,
    },
  });
  return {
    ...newProfile,
  };
};
