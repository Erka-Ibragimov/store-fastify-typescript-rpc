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
  const test = await prisma.basketDevice.findMany({
    where: {
      basketId: user.user.basket.id,
    },
  });
  const manyDeviceId: string[] = [];
  test.forEach((el) => {
    manyDeviceId.push(el.deviceId);
  });

  const devices = await prisma.device.findMany({
    where: {
      id: { in: manyDeviceId },
    },
  });
  return devices;
};
