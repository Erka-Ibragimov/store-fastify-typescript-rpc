import { FastifyInstance, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import path from "path";
import fs from "fs";
import {
  InvalidParameters,
  JsonRpcError,
  JsonRpcPayloadRequest,
} from "json-rpc-protocol";
import Ajv, { ErrorObject } from "ajv";
import { JsonRpcRequest } from "./jsonrpc";

declare module "fastify" {
  interface FastifyInstance {
    router(request: FastifyRequest): Promise<unknown | unknown>;
  }
}

interface IMethod {
  default(
    params: JsonRpcRequest<any>,
    fastify?: FastifyInstance
  ): Promise<unknown | unknown>;
  schema?: Record<string, unknown>;
}

const filterErrors = (errors: ErrorObject[]) => {
  return errors.map((error) => {
    let resultErrorObj: {
      property?: string;
      message?: string;
    } = {};
    if (error.keyword == "required") {
      resultErrorObj = {
        property: error.params.missingProperty,
        message: error.message ? error.message : "Something wrong",
      };
    }
    if (error.keyword == "additionalProperties") {
      resultErrorObj = {
        property: error.params.additionalProperty,
        message: error.message ? error.message : "Something wrong",
      };
    }
    if (error.keyword == "type") {
      resultErrorObj = {
        property: error.instancePath.split("/")[1],
        message: error.message ? error.message : "Something wrong",
      };
    }
    return resultErrorObj;
  });
};

export default fp(async (fastify: FastifyInstance) => {
  const handler: { [key: string]: IMethod } = {};
  const pathToMethod = path.join(__dirname, "../methods/");
  const data = fs.readdirSync(pathToMethod);
  data.forEach(async (method: string) => {
    const nameOfMethod = method.split(".")[0];
    handler[nameOfMethod] = await import(pathToMethod + method);
  });

  const router = async (request: FastifyRequest) => {
    const { method, params } = request.body as FastifyRequest;
    if (!handler[method]) {
      throw new JsonRpcError("Method not found");
    }
    const { schema } = handler[method];

    if (schema) {
      if (schema.type === "object") {
        schema.additionalProperties = schema.additionalProperties || false;
      }
      const ajv = new Ajv({ allErrors: true });
      const validate = ajv.compile(schema);
      const valid = validate(params);
      if (!valid && validate && validate.errors) {
        const errors = filterErrors(validate.errors);
        throw new InvalidParameters(errors as any);
      }
    }

    const result = await handler[method].default(
      {
        ...(request.body as JsonRpcPayloadRequest),
        ip: request.ip,
        headers: request.headers,
      },
      fastify
    );

    return result;
  };

  fastify.decorate("router", router);
});
