import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { TokenPayload } from "src/common/dto/token-payload.dto";

export const GetTokenPayload = createParamDecorator(
  (_: undefined, context: ExecutionContext): TokenPayload => {
    const request = context.switchToHttp().getRequest();
    return request.user as TokenPayload;
  },
);
