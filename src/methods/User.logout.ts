import { FastifyInstance } from "fastify";

export default async ({ logout }: FastifyInstance) => {
  await logout();
  return true;
};
