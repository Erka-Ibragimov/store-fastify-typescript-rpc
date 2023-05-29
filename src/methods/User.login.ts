import { FastifyInstance } from "fastify";
import { JsonRpcRequest } from "../plugins/jsonrpc";
import { Static, Type } from "@sinclair/typebox";
import { JsonRpcError } from "json-rpc-protocol";
import { compare } from "bcrypt";
import { createToken, generateCode } from "../services/security";
import { addSeconds } from "date-fns";

export const schema = Type.Object({
  username: Type.Optional(Type.String()),
  password: Type.Optional(Type.String()),
  phoneNumber: Type.Optional(Type.String()),
  code: Type.Optional(Type.String()),
});

export type Params = Static<typeof schema>;

export default async ({ params }: JsonRpcRequest<Params>, { config, prisma, redis }: FastifyInstance) => {
  if (!params.username && !params.phoneNumber) throw new JsonRpcError(`Вам нужно ввести username или phoneNumber`);

  let where: any = {};
  if (params.phoneNumber) {
    where["phoneNumber"] = params.phoneNumber;
  } else {
    where["username"] = params.username;
  }
  if (where.hasOwnProperty("username")) {
    if (!params.password) throw new JsonRpcError(`Вам нужно ввести password от ${params.username}`);

    const existUser = await prisma.user.findFirst({ where });

    if (!existUser) throw new JsonRpcError(`Пользователь с таким username ${params.username} не найден`);
    const hashPass = await compare(params.password, existUser.password!);
    if (!hashPass) throw new JsonRpcError("Введеный password не верный");

    const existSession = await prisma.session.findFirst({
      where: {
        userId: existUser.id,
      },
    });

    await prisma.session.delete({
      where: { id: existSession!.id },
    });

    const session = await prisma.session.create({
      data: {
        token: await createToken({ name: params.username }),
        expiresAt: addSeconds(new Date(), config.token.expiresIn),
        userId: existUser.id,
      },
      select: {
        token: true,
        expiresAt: true,
      },
    });

    return {
      ...existUser,
      ...session,
    };
  }
  if (where.hasOwnProperty("phoneNumber")) {
    const existUser = await prisma.user.findFirst({ where });
    if (!existUser) throw new JsonRpcError(`Пользователя с таким ${params.phoneNumber} не существует`);
    const otp = await redis.hgetall(`otp:register:${params.phoneNumber}`);

    if (params.phoneNumber && params.code === undefined) {
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
        throw new JsonRpcError("Не верный код");
      }

      await redis.del(`otp:register:${params.phoneNumber}`);
    }

    const existSession = await prisma.session.findFirst({
      where: {
        userId: existUser.id,
      },
    });

    await prisma.session.delete({
      where: { id: existSession!.id },
    });

    const session = await prisma.session.create({
      data: {
        token: await createToken({ name: params.phoneNumber }),
        expiresAt: addSeconds(new Date(), config.token.expiresIn),
        userId: existUser.id,
      },
      select: {
        token: true,
        expiresAt: true,
      },
    });
    const { password, ...other } = existUser;
    return {
      ...other,
      ...session,
    };
  }
};
