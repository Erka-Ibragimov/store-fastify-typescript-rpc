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
  port: process.env.PORT,
  host: process.env.HOST,
  token: {
    expiresIn: 1800,
    key: process.env.TOKEN_SECRET,
  },
  otp: {
    expiresIn: 60,
    attempts: 3,
  },
};
