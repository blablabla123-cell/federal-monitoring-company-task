import { InvalidAccessTokenException } from '../../../exceptions';
import { AccessTokenGuard } from './access-token.guard';

describe('AccessTokenGuard', () => {
  let guard: AccessTokenGuard;

  beforeEach(() => {
    guard = new AccessTokenGuard();
  });

  it('Returns user when request is valid', () => {
    const user = { id: 1 };

    const result = guard.handleRequest<unknown>(null, user);

    expect(result).toBe(user);
  });

  it('Throws InvalidAccessTokenException when user is null', () => {
    expect(() => guard.handleRequest<unknown>(null, null)).toThrow(
      InvalidAccessTokenException,
    );
  });
});
