import config from "../config";
import * as jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const generateCode = () => {
  let code = "";
  while (code.length < 6) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
};

export const createToken = async (data: any) => {
  return jwt.sign(data, config.token.key as string, {
    algorithm: "HS256",
    expiresIn: config.token.expiresIn,
  });
};

export const hash = async (password: string, salt: number = 5) => {
  return await bcrypt.hash(password, salt);
};

export const compare = async (password: string, hashPassword: string) => {
  return await bcrypt.compare(password, hashPassword);
};
