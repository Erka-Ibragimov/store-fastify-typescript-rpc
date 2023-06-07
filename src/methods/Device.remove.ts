import { FastifyInstance } from "fastify";
import { JsonRpcRequest } from "../plugins/jsonrpc";
import { Type, Static } from "@sinclair/typebox";
import { JsonRpcError } from "json-rpc-protocol";

export const schema = Type.Object({
  deviceId: Type.String(),
});

type Params = Static<typeof schema>;

export default async (
  { params }: JsonRpcRequest<Params>,
  { authorize, prisma }: FastifyInstance
) => {
  await authorize();
  const basket = await prisma.basketDevice.findFirst({
    where: {
      deviceId: params.deviceId,
    },
  });
  if (!basket) {
    throw new JsonRpcError("В корзине нет такого продукта");
  }
  await prisma.basketDevice.delete({
    where: {
      basketId_deviceId: {
        basketId: basket.basketId,
        deviceId: basket.deviceId,
      },
    },
  });

  const result = await prisma.device.delete({
    where: {
      id: params.deviceId,
    },
  });
  return result;
};
