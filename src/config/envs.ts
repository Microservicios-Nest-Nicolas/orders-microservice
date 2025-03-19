import * as joi from 'joi';

process.loadEnvFile();

interface EnvVars {
  PORT: number;
}

// Validamos las variables de entorno
const envsSchema = joi
  .object({
    PORT: joi.number().required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
  port: envVars.PORT,
};