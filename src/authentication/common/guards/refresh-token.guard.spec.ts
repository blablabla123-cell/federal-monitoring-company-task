import { ExecutionContext } from '@nestjs/common';
import { RefreshTokenGuard } from './refresh-token.guard';
import { InvalidRefreshTokenException } from '../../../exceptions';
describe('RefreshTokenGuard', () => {
  let guard: RefreshTokenGuard;

  beforeEach(() => {
    guard = new RefreshTokenGuard();
  });

  it('Returns user when request is valid', () => {
    const user = { id: 1 };

    const result = guard.handleRequest<unknown>(null, user);

    expect(result).toBe(user);
  });

  it('Throws InvalidRefreshTokenException when user is null', () => {
    expect(() => guard.handleRequest<unknown>(null, null)).toThrow(
      InvalidRefreshTokenException,
    );
  });
});
