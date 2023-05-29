import { FastifyInstance } from "fastify";
import { JsonRpcRequest } from "../plugins/jsonrpc";
import { Type, Static } from "@sinclair/typebox";
import { JsonRpcError } from "json-rpc-protocol";
import { addSeconds } from "date-fns";
import { generateCode } from "../services/security";

export const schema = Type.Object({
  oldPhoneNumber: Type.String(),
  newPhoneNumber: Type.String(),
  code: Type.Optional(Type.String()),
});

type Params = Static<typeof schema>;

export default async ({ params }: JsonRpcRequest<Params>, { authorize, prisma, redis, config }: FastifyInstance) => {
  const user = await authorize();

  const existUser = await prisma.user.findFirst({
    where: {
      phoneNumber: params.oldPhoneNumber,
    },
  });
  if (!existUser) throw new JsonRpcError("Не найдет номер");
  const otp = await redis.hgetall("phoneNumber");

  if (params.newPhoneNumber && params.code === undefined) {
    if (Object.keys(otp).length !== 0) {
      return {
        code: otp.code,
        expiresIn: Number(otp.expiresIn),
        expiresAt: new Date(otp.expiresAt),
      };
    }

    const newOtp = {
      code: generateCode(),
      expiresIn: config.otp.expiresIn,
      expiresAt: config.otp.expiresIn && addSeconds(new Date(), config.otp.expiresIn),
      attempts: config.otp.attempts,
    };
    await redis.hset(`phoneNumber`, newOtp);
    await redis.expire(`phoneNumber`, config.otp.expiresIn);
    return newOtp;
  }
  if (params.newPhoneNumber && params.code) {
    if (Object.keys(otp).length) {
      if (+otp.attempts > 1) {
        await redis.hset(`phoneNumber`, {
          attempts: +otp.attempts - 1,
        });
      } else {
        await redis.del(`phoneNumber`);
      }
    }

    if (!Object.keys(otp).length || params.code !== otp.code) {
      throw new JsonRpcError("Не верный код");
    }

    await redis.del(`phoneNumber`);
  }

  const newPhoneNumber = await prisma.user.update({
    where: {
      id: existUser.id,
    },
    data: {
      phoneNumber: params.newPhoneNumber,
    },
  });

  const { password, ...other } = newPhoneNumber;
  return {
    ...other,
  };
};
