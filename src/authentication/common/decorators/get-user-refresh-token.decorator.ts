import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import { RefreshToken } from "src/authentication/types/rt.type";

export const GetUserRefreshToken = createParamDecorator(
  (_: undefined, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest();
    const rt = request.user as RefreshToken;
    return rt.refreshToken;
  },
);
