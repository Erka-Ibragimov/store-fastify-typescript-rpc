import fp from "fastify-plugin";
import { JsonRpcError } from "json-rpc-protocol";

declare module "fastify" {
  interface FastifyInstance {
    authorize(): any;
    logout(): any;
  }
}

export default fp(async (fastify) => {
  fastify.decorate("authorize", null);
  fastify.decorate("logout", null);

  fastify.addHook("preHandler", async (request) => {
    const getToken = async () => {
      if (request.headers && request.headers.authorization) {
        return request.headers.authorization.split(" ")[1];
      }
      return null;
    };

    fastify.authorize = async () => { 
      const token = getToken();
      if (!token) {
        throw new JsonRpcError("Not authorized");
      }
    };
  });
});
