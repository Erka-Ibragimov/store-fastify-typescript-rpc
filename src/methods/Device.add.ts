import { FastifyInstance } from "fastify";
import { JsonRpcRequest } from "../plugins/jsonrpc";
import { Static, Type } from "@sinclair/typebox";
import { saveImage } from "../services/image";
import cuid from "cuid";

export const schema = Type.Object({
  name: Type.String(),
  price: Type.String(),
  rate: Type.Integer(),
  type: Type.String(),
  brand: Type.String(),
  image: Type.Optional(Type.String()),
});

type Params = Static<typeof schema>;

export default async ({ params }: JsonRpcRequest<Params>, { config, prisma, authorize }: FastifyInstance) => {
  const user = await authorize();
  const { type, brand, image, ...other } = params;

  let pathToImage;
  const nameImage = cuid();
  if (image) {
    pathToImage = await saveImage(image, nameImage, "devices", user.userId);
  }

  const typeDevice = await prisma.type.create({
    data: {
      name: type,
    },
  });

  const brandDevice = await prisma.brand.create({
    data: {
      name: brand,
    },
  });

  const device = await prisma.device.create({
    data: {
      ...other,
      pathImg: pathToImage,
      devices: {
        create: {
          basket: { connect: { id: user.user.basket.id } },
        },
      },
      typeId: typeDevice.id,
      brandId: brandDevice.id,
    },
  });
  return device;
};
