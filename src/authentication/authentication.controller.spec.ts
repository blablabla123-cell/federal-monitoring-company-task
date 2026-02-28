import { TestingModule, Test } from '@nestjs/testing';
import { ResponseStatus, JWTPayload } from '../common';
import { ApiResponse } from '../common/types';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { AuthenticationDto } from './dto';

describe('AuthenticationController', () => {
  let controller: AuthenticationController;

  let mockService: any;

  beforeEach(async () => {
    mockService = {
      signUp: jest.fn(),
      signIn: jest.fn(),
      resetPassword: jest.fn(),
      refresh: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [
        {
          provide: AuthenticationService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get(AuthenticationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Sign up feature', () => {
    it('Should sign user up and give tokens back', async () => {
      const dto: AuthenticationDto = {
        email: 'test@mail.ru',
        password: 'password',
        name: 'John Smith',
      };

      const mockResponse: ApiResponse = {
        status: ResponseStatus.SUCCESS,
        message: 'User successfully signed up.',
        data: {
          accessToken: 'access_token',
          refreshToken: 'refresh_token',
        },
      };

      mockService.signUp.mockResolvedValue(mockResponse);

      const result = await controller.signUp(dto);

      expect(mockService.signUp).toHaveBeenCalledWith(dto);
      expect(mockService.signUp).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Sign in feature', () => {
    it('Should log in and send user tokens', async () => {
      const dto: AuthenticationDto = {
        email: 'test@mail.ru',
        password: 'password',
        name: 'Christiano Ronaldo',
      };

      const mockResponse: ApiResponse = {
        status: ResponseStatus.SUCCESS,
        message: 'User successfully signed in.',
        data: {
          accessToken: 'access_token',
          refreshToken: 'refresh_token',
        },
      };

      mockService.signIn.mockResolvedValue(mockResponse);

      const result = await controller.signIn(dto);

      expect(mockService.signIn).toHaveBeenCalledWith(dto);
      expect(mockService.signIn).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Reset password functionality', () => {
    it('Should update password and return success', async () => {
      const dto: AuthenticationDto = {
        email: 'test@example.ru',
        password: 'newPassword',
        name: 'Ilya Topuria',
      };

      const mockResponse: ApiResponse = {
        status: ResponseStatus.SUCCESS,
        message: 'Password has been reset.',
      };

      mockService.resetPassword.mockResolvedValue(mockResponse);

      const result = await controller.changePassword(dto);

      expect(mockService.resetPassword).toHaveBeenCalledWith(dto);
      expect(mockService.resetPassword).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Refresh token route', () => {
    it('Should sign a new access token and send it back to the client', async () => {
      const payload: JWTPayload = { sub: 1 };
      const refreshToken = 'refresh_token';

      const mockResponse: ApiResponse = {
        status: ResponseStatus.SUCCESS,
        data: {
          accessToken: 'access_token',
        },
      };

      mockService.refresh.mockResolvedValue(mockResponse);

      const result = await controller.refresh(payload, refreshToken);

      expect(mockService.refresh).toHaveBeenCalledWith(payload, refreshToken);
      expect(mockService.refresh).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });
});
