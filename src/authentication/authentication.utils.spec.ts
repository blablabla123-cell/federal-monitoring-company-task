import { AuthenticationUtils } from './authentication.utils';

describe('Testing utils for authentication', () => {
  let utils: AuthenticationUtils;

  beforeEach(() => {
    utils = new AuthenticationUtils();
  });

  describe('Hashing', () => {
    it('Should hash a value and spit a different string', async () => {
      const value = 'user-password';

      const hash = await utils.hash(value);

      expect(typeof hash).toBe('string');

      expect(hash).not.toBe(value);
    });

    it('Should return true when comparing a password against its hash', async () => {
      const value = 'user-password';

      const hash = await utils.hash(value);

      const result = await utils.compare(value, hash);

      expect(result).toBe(true);
    });

    it("Should return false when they don't match", async () => {
      const value = 'user-password';

      const falseValue = 'false-password';

      const hash = await utils.hash(value);

      const result = await utils.compare(falseValue, hash);

      expect(result).toBe(false);
    });
  });

  describe('Generates a random famous name', () => {
    it('Should return a valid name from the names array', () => {
      const name = utils.generateName();

      expect(typeof name).toBe('string');
      expect(name).toBeDefined();
      expect(name).not.toBe('');
    });
  });
});
