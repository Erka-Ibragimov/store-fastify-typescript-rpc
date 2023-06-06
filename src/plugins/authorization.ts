import { addSeconds } from "date-fns";
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
    const getToken = () => {
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

      const session = await fastify.prisma.session.findFirst({
        where: { token },
        include: {
          user: {
            select: {
              name: true,
              role: true,
              permissions: true,
              isAdmin: true,
              phoneNumber: true,
              username: true,
              photoPath: true,
              basket: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

      if (!session) {
        throw new JsonRpcError("Not authorized");
      }

      if (fastify.config.token.expiresIn) {
        await fastify.prisma.session.update({
          data: {
            expiresAt:
              session.expiresAt &&
              addSeconds(new Date(), fastify.config.token.expiresIn),
          },
          where: { id: session.id },
        });
      }
      return { ...session };
    };

    fastify.logout = async () => {
      const token = getToken();
      if (!token) {
        throw new JsonRpcError("Not authorized");
      }
      await fastify.prisma.session.delete({
        where: { token },
      });
      return true;
    };
  });
});
