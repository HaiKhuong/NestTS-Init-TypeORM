import { registerAs } from '@nestjs/config';

export default registerAs('apple', () => ({
  appAudience: process.env.APPLE_APP_AUDIENCE,
}));
