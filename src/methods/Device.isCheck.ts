import { Type, Static } from "@sinclair/typebox";
import { JsonRpcRequest } from "../plugins/jsonrpc";
import { FastifyInstance } from "fastify";
import { JsonRpcError } from "json-rpc-protocol";

export const schema = Type.Object({
  isCheck: Type.Boolean(),
  deviceId: Type.String(),
});

type Params = Static<typeof schema>;
export default async (
  { params }: JsonRpcRequest<Params>,
  { authorize, prisma }: FastifyInstance
) => {
  await authorize();
  const device = await prisma.device.findFirst({
    where: {
      id: params.deviceId,
    },
  });
  if (!device) {
    throw new JsonRpcError("Устройство не найдено");
  }
  await prisma.device.update({
    data: {
      isCheck: params.isCheck,
    },
    where: {
      id: params.deviceId,
    },
  });
  return true;
};
