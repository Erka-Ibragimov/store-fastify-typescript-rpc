import { Static, Type } from "@sinclair/typebox";
import { JsonRpcRequest } from "../plugins/jsonrpc";
import { FastifyInstance } from "fastify";
import { JsonRpcError } from "json-rpc-protocol";
import { createToken, generateCode, hash } from "../services/security";
import { addSeconds } from "date-fns";
import cuid from "cuid";
import { saveImage } from "../services/image";

export const schema = Type.Object({
  name: Type.String(),
  surname: Type.Optional(Type.String()),
  username: Type.Optional(Type.String()),
  password: Type.Optional(Type.String()),
  phoneNumber: Type.Optional(Type.String()),
  code: Type.Optional(Type.String()),
});

export type Params = Static<typeof schema>;

export default async ({ params }: JsonRpcRequest<Params>, { config, prisma, redis }: FastifyInstance) => {
  if (!params.username && !params.phoneNumber) {
    throw new JsonRpcError("Need username or phoneNumber");
  }

  let where: any = {};

  if (params.phoneNumber && !params.username) {
    where["phoneNumber"] = params.phoneNumber;
  } else if (params.username && !params.phoneNumber) {
    if (!params.password) {
      throw new JsonRpcError("Need write password");
    }
    where["username"] = params.username;
  } else {
    where["phoneNumber"] = params.phoneNumber;
    where["username"] = params.username;
  }

  const oldUser = await prisma.user.findFirst({
    where,
  });

  if (oldUser) {
    throw new JsonRpcError("This user existed!");
  }

  const otp = await redis.hgetall(`otp:register:${params.phoneNumber}`);

  if (params.phoneNumber && params.code == undefined) {
    if (Object.keys(otp).length) {
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
    await redis.hset(`otp:register:${params.phoneNumber}`, newOtp);
    await redis.expire(`otp:register:${params.phoneNumber}`, config.otp.expiresIn);
    return newOtp;
  }

  if (params.phoneNumber && params.code) {
    if (Object.keys(otp).length) {
      if (+otp.attempts > 1) {
        await redis.hset(`otp:register:${params.phoneNumber}`, {
          attempts: +otp.attempts - 1,
        });
      } else {
        await redis.del(`otp:register:${params.phoneNumber}`);
      }
    }

    if (!Object.keys(otp).length || params.code !== otp.code) {
      throw new JsonRpcError("Invalid code!");
    }

    await redis.del(`otp:register:${params.phoneNumber}`);
  }

  const user = await prisma.user.create({
    data: {
      name: params.name,
      surname: params.surname,
      username: params.username,
      password: params.password ? await hash(params.password!) : undefined,
      phoneNumber: params.phoneNumber,
      permissions: {},
    },
    include: {
      rating: {
        select: {
          rate: true,
          deviceId: true,
        },
      },
      session: {
        select: {
          token: true,
          userId: true,
          expiresAt: true,
        },
      },
    },
  });

  const session = await prisma.session.create({
    data: {
      token: await createToken({ name: params.name }),
      expiresAt: addSeconds(new Date(), config.token.expiresIn),
      userId: user.id,
    },
    select: {
      token: true,
      expiresAt: true,
    },
  });

  const basket = await prisma.basket.create({
    data: {
      userId: user.id,
    },
    select: {
      userId: true,
      basketDevice: true,
    },
  });

  const { password, ...other } = user;
  return {
    ...other,
    ...basket,
    ...session,
  };
};
