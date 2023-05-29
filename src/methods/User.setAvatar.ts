import { FastifyInstance } from "fastify";
import { JsonRpcRequest } from "../plugins/jsonrpc";
import { Static, Type } from "@sinclair/typebox";
import cuid from "cuid";
import { saveImage } from "../services/image";
import { existsSync, rmdirSync } from "fs";

const schema = Type.Object({
  newPhoto: Type.String(),
});

type Params = Static<typeof schema>;

export default async ({ params }: JsonRpcRequest<Params>, { prisma, authorize }: FastifyInstance) => {
  const user = await authorize();

  let pathToImage;
  const nameImage = cuid();
  if (params.newPhoto) {
    pathToImage = await saveImage(params.newPhoto, nameImage, "users", user.userId);
  }

  const newUserPhoto = await prisma.user.update({
    where: {
      id: user.userId,
    },
    data: {
      photoPath: pathToImage,
    },
  });

  const { password, ...other } = newUserPhoto;

  return {
    ...other,
  };
};
