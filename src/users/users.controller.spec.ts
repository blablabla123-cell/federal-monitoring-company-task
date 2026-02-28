import { TestingModule, Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { JWTPayload, ResponseStatus } from '../common';
import { ApiResponse } from '../common/types';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let mockService: any;

  const userPayload: JWTPayload = { sub: 1 };

  beforeEach(async () => {
    mockService = {
      getUser: jest.fn(),
      deleteAccount: jest.fn(),
      editUser: jest.fn(),
      userLogOut: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Simply get user and sign token for web socket authentication', () => {
    it('Should return user and socket jwt token', async () => {
      const mockResponse: ApiResponse = {
        status: ResponseStatus.SUCCESS,
        data: {
          user: { id: 1, email: 'test@mail.ru', name: 'Vladimir Putin' },
          socketToken: 'ws-jwt-token',
        },
      };

      mockService.getUser.mockResolvedValue(mockResponse);

      const result = await controller.getUser(userPayload);

      expect(mockService.getUser).toHaveBeenCalledWith(userPayload);
      expect(mockService.getUser).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Delete account feature', () => {
    it('Should simply delete user row', async () => {
      const mockResponse: ApiResponse = {
        status: ResponseStatus.SUCCESS,
        message: 'Your account is deleted successfully.',
        data: { id: 1, email: 'test@mail.ru' },
      };

      mockService.deleteAccount.mockResolvedValue(mockResponse);

      const result = await controller.deleteAccount(userPayload);

      expect(mockService.deleteAccount).toHaveBeenCalledWith(userPayload);

      expect(mockService.deleteAccount).toHaveBeenCalledTimes(1);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Update user profile', () => {
    it('Should update user profile', async () => {
      const data: Prisma.UserUpdateInput = {
        name: 'Donald Trump',
        email: 'test@mail.com',
      };

      const mockResponse: ApiResponse = {
        status: ResponseStatus.SUCCESS,
        message: 'User successfully updated.',
        data: { id: 1, name: 'Donald Trump', email: 'test@mail.com' },
      };

      mockService.editUser.mockResolvedValue(mockResponse);

      const result = await controller.updateUser(userPayload, data);

      expect(mockService.editUser).toHaveBeenCalledWith(userPayload, data);
      expect(mockService.editUser).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Log out user feature', () => {
    it('Clear rt hash and send success message', async () => {
      const mockResponse: ApiResponse = {
        status: ResponseStatus.SUCCESS,
        message: 'User successfully logged out.',
      };

      mockService.userLogOut.mockResolvedValue(mockResponse);

      const result = await controller.userLogOut(userPayload);

      expect(mockService.userLogOut).toHaveBeenCalledWith(userPayload);
      expect(mockService.userLogOut).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse);
    });
  });
});
