import winston from "winston";
import Sentry from "winston-sentry-log";

const option = {
  config: {
    dsn: "https://3d12ab34d6e44a0089cad23b05f9f365@o1166026.ingest.sentry.io/6256247",
  },
  level: "info",
};

const Logger = winston.createLogger({
  transports: [new Sentry(option)],
});
export default Logger;
