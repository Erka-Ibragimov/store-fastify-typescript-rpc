import { FastifyInstance } from "fastify/types/instance";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyRequest {
    language: string;
  }

  interface FastifyInstance {
    t(message: string, language?: string): string;
  }
}

export default fp(async (fastify: FastifyInstance) => {
  const i18n: { [key: string]: Record<string, string> } = {
    ru: (await import("../i18n/ru")).default,
  };
  fastify.decorate("t", async (message: string, language?: string) => {
    if (language && i18n[language] && i18n[language][message]) {
      return i18n[language][message];
    }
    return message;
  });

  fastify.decorateRequest("language", "ru");

  fastify.addHook("preHandler", async (request) => {
    const langFromHeaders =
      ["ru", "en", "uz"].find((item) => {
        item === request.headers["accept-language"]?.toLowerCase();
      }) || request.language;

    fastify.t = (message: string, language?: string): string => {
      const lang = language || langFromHeaders;
      if (i18n[lang] && i18n[lang][message]) {
        return i18n[lang][message];
      }
      return message;
    };

    request.language = langFromHeaders;
  });
});
