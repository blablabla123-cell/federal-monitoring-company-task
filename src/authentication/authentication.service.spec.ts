import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationService } from './authentication.service';
import { DatabaseService } from '../database/database.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthenticationDto } from './dto';

import { ResponseStatus } from '../common';
import { JWTPayload } from '../common';
import {
  UserAlreadyExistsException,
  UserNotFoundException,
  InvalidRefreshTokenException,
} from '../exceptions';
import { AuthenticationUtils } from './authentication.utils';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let mockDatabaseService: any;
  let mockJwtService: any;
  let mockConfigService: any;
  let mockAuthenticationUtils: any;

  const mockUser = {
    id: 1,
    name: 'Cristiano Ronaldo',
    email: 'test@mail.ru',
    password: 'password',
    rtHash: 'refresh_token',
  };

  beforeEach(async () => {
    mockAuthenticationUtils = {
      hash: jest.fn(),
      generateName: jest.fn(),
      compare: jest.fn(),
    };
    mockDatabaseService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    mockJwtService = {
      signAsync: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET_ACCESS') return 'test-secret-access';
        if (key === 'JWT_SECRET_REFRESH') return 'test-secret-refresh';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AuthenticationUtils, useValue: mockAuthenticationUtils },
      ],
    }).compile();

    service = module.get(AuthenticationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Sign up feat', () => {
    it('Creates a new user and returns tokens', async () => {
      const dto: AuthenticationDto = {
        email: 'test@mail.ru',
        password: 'password',
        name: 'Vladimir Putin',
      };

      const mockUser = { id: 1, email: dto.email, name: dto.name };

      mockDatabaseService.user.findUnique.mockResolvedValue(null);

      mockDatabaseService.user.create.mockResolvedValue(mockUser);

      mockDatabaseService.user.update.mockResolvedValue(mockUser);

      mockJwtService.signAsync
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');

      const result = await service.signUp(dto);

      expect(result.status).toBe(ResponseStatus.SUCCESS);
      expect(result.data).toHaveProperty('accessToken');
      expect(result.data).toHaveProperty('refreshToken');
    });

    it('Should throw UserAlreadyExists Exception', async () => {
      const dto: AuthenticationDto = {
        email: 'test@mail.ru',
        password: 'password',
        name: 'Donald Trump',
      };

      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.signUp(dto)).rejects.toThrow(
        UserAlreadyExistsException,
      );
    });
  });

  describe('Sign in', () => {
    it('Should successfully sign in if email and password match', async () => {
      const dto: AuthenticationDto = {
        name: 'Cristiano Ronaldo',
        email: 'test@mail.ru',
        password: 'password',
        rtHash: 'refresh_token',
      };

      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);

      mockAuthenticationUtils.compare.mockResolvedValue(true);

      mockJwtService.signAsync
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');

      const result = await service.signIn(dto);

      expect(mockDatabaseService.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });

      expect(mockAuthenticationUtils.compare).toHaveBeenCalledWith(
        dto.password,
        mockUser.password,
      );

      expect(result).toEqual({
        status: ResponseStatus.SUCCESS,
        message: 'User successfully signed in.',
        data: { accessToken: 'access_token', refreshToken: 'refresh_token' },
      });
    });

    it('Throws UserNotFoundException if user not found', async () => {
      const dto: AuthenticationDto = {
        email: 'test@mail.ru',
        password: 'password',
        name: 'Jeremy Clarkson',
      };

      mockDatabaseService.user.findUnique.mockResolvedValue(null);

      await expect(service.signIn(dto)).rejects.toThrow(UserNotFoundException);
    });

    it('Throws UnAuthorizedException if password is incorrect', async () => {
      const dto: AuthenticationDto = {
        email: 'test@mail.ru',
        password: 'password',
        name: 'David Laid',
      };

      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);

      mockAuthenticationUtils.compare.mockResolvedValueOnce(false);

      await expect(service.signIn(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Refresh token feat', () => {
    it('Should sign a new at token and send it to user', async () => {
      const payload: JWTPayload = { sub: 1 };
      const refreshToken = 'refresh_token';

      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);
      mockAuthenticationUtils.compare.mockResolvedValueOnce(true);
      mockJwtService.signAsync.mockResolvedValueOnce('access_token');

      const result = await service.refresh(payload, refreshToken);

      expect(mockDatabaseService.user.findUnique).toHaveBeenCalledWith({
        where: { id: payload.sub },
      });

      expect(result).toEqual({
        status: ResponseStatus.SUCCESS,
        data: { accessToken: 'access_token' },
      });
    });

    it('Throw UserNotFoundException if user not found or rtHash is missing', async () => {
      const payload: JWTPayload = { sub: 999999 };
      const refreshToken = 'refresh_token';

      mockDatabaseService.user.findUnique.mockResolvedValue(null);

      await expect(service.refresh(payload, refreshToken)).rejects.toThrow(
        UserNotFoundException,
      );
    });

    it('Throw InvalidRefreshToken if refresh token is invalid', async () => {
      const payload: JWTPayload = { sub: 1 };
      const refreshToken = 'refresh_token';

      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);
      mockAuthenticationUtils.compare.mockResolvedValueOnce(false);

      await expect(service.refresh(payload, refreshToken)).rejects.toThrow(
        InvalidRefreshTokenException,
      );
    });
  });

  describe('Reset password feat', () => {
    it("Should update and save user's password", async () => {
      const dto: AuthenticationDto = {
        email: 'test@mail.ru',
        password: 'password',
        name: 'Peter Parker',
      };

      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);
      mockDatabaseService.user.update.mockResolvedValue(mockUser);

      const result = await service.resetPassword(dto);

      expect(mockDatabaseService.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });

      expect(mockAuthenticationUtils.hash).toHaveBeenCalledWith(dto.password);

      expect(result).toEqual({
        status: ResponseStatus.SUCCESS,
        message: 'Password has been reset.',
      });
    });
  });
});
