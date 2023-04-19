import * as dotenv from "dotenv";
dotenv.config();

export default {
  database: {
    postgres: {
      url: process.env.POTGRES_URL,
    },
    redis: {
      url: process.env.REDIS_URL,
    },
  },
  port:process.env.PORT,
  host:process.env.HOST
};
