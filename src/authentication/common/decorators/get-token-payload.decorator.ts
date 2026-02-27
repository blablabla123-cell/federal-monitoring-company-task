import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JWTPayload } from 'src/common';

export const GetTokenPayload = createParamDecorator(
  (_: undefined, context: ExecutionContext): JWTPayload => {
    const request = context.switchToHttp().getRequest();
    return request.user as JWTPayload;
  },
);
