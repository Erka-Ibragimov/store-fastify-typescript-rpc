import { Type, Static } from "@sinclair/typebox";
import { JsonRpcRequest } from "../plugins/jsonrpc";
import { FastifyInstance } from "fastify";
import { JsonRpcError } from "json-rpc-protocol";

export const schema = Type.Object({
  isCheck: Type.Boolean(),
  arrDeviceId: Type.Array(Type.String()),
});

type Params = Static<typeof schema>;
export default async (
  { params }: JsonRpcRequest<Params>,
  { authorize, prisma }: FastifyInstance
) => {
  await authorize();
  await prisma.device.updateMany({
    data: {
      isCheck: params.isCheck,
    },
    where: {
      id: { in: params.arrDeviceId },
    },
  });
  return true;
};
