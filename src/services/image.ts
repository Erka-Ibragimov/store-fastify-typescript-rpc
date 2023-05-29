import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";
import path from "path";

export const saveImage = async (imageBase64: string | undefined, name: string, type: string, userId: string) => {
  if (!imageBase64) {
    return null;
  }
  try {
    const pathToPublic = path.join(__dirname, "../../public");
    if (!existsSync(pathToPublic)) {
      mkdirSync(pathToPublic);
    }

    let pathToType;

    if (type === "device") {
      pathToType = path.join(pathToPublic, "devices");
    } else {
      pathToType = path.join(pathToPublic, "users");
    }

    if (!existsSync(pathToType)) {
      mkdirSync(pathToType);
    }

    const pathToImage = path.join(pathToType, userId);

    if (!existsSync(pathToImage)) {
      mkdirSync(pathToImage);
    }

    const nameImage = path.join(pathToImage, name) + ".png";

    const uri = imageBase64.split(";base64,").pop();
    const imageBuffer = Buffer.from(uri!, "base64");

    const image = sharp(imageBuffer).png();
    await image
      .resize(300, 300, {
        background: { r: 0, b: 0, g: 0, alpha: 0 },
      })
      .toFile(`${nameImage}`);

    return nameImage;
  } catch (e) {
    console.log(e);
  }
};
