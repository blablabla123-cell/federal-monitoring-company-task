import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { DatabaseService } from '../database/database.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';
import { UserNotFoundException } from '../exceptions';
import { ResponseStatus } from '../common';
import { JWTPayload } from '../common';
import { plainToClass } from 'class-transformer';
import { UserDataDto } from '../common';
import { Prisma } from '@prisma/client';

const mockUser = {
  id: 1,
  email: 'test@mail.ru',
  name: 'Ronnie Coleman',
  rtHash: 'hashed-rt',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const JWT_SOCKET = 'jwt-socket-secret';

describe('UsersService', () => {
  let service: UsersService;
  let mockDatabaseService: any;
  let mockJwtService: any;
  let mockConfigService: any;

  const mockPayload: JWTPayload = { sub: 1 };

  beforeEach(async () => {
    mockDatabaseService = {
      user: {
        findUnique: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      },
    };

    mockJwtService = {
      signAsync: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SOCKET') return JWT_SOCKET;
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Get user route', () => {
    it('Should return user data and sign jwt token for socket authentication', async () => {
      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue('ws-token');

      const result = await service.getUser(mockPayload);

      expect(mockDatabaseService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockPayload.sub },
      });

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { sub: 1 },
        {
          secret: JWT_SOCKET,
          expiresIn: 60 * 15,
        },
      );

      expect(result.status).toBe(ResponseStatus.SUCCESS);
      expect(result.data.user).toEqual(plainToClass(UserDataDto, mockUser));
      expect(result.data.socketToken).toBe('ws-token');
    });

    it('Throw UserNotFoundException if user not found', async () => {
      mockDatabaseService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUser(mockPayload)).rejects.toThrow(
        UserNotFoundException,
      );

      expect(mockDatabaseService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockPayload.sub },
      });
    });

    it('Throw UserNotFoundException if user has no rt hash', async () => {
      mockDatabaseService.user.findUnique.mockResolvedValue({
        ...mockUser,
        rtHash: null,
      });

      await expect(service.getUser(mockPayload)).rejects.toThrow(
        UserNotFoundException,
      );
    });
  });

  describe('Delete account feature', () => {
    it('Should delete user and return success message', async () => {
      mockDatabaseService.user.delete.mockResolvedValue(mockUser);

      const result = await service.deleteAccount(mockPayload);

      expect(mockDatabaseService.user.delete).toHaveBeenCalledWith({
        where: { id: mockPayload.sub },
      });

      expect(result).toEqual({
        status: ResponseStatus.SUCCESS,
        message: 'Your account is deleted successfully.',
        data: mockUser,
      });
    });
  });

  describe('Update user row', () => {
    it('Should update user and return successful message', async () => {
      mockDatabaseService.user.update.mockResolvedValue(mockUser);

      const dto: Prisma.UserUpdateInput = {
        name: 'Hillary Clinton',
      };

      const result = await service.editUser(mockPayload, dto);

      expect(mockDatabaseService.user.update).toHaveBeenCalledWith({
        where: { id: mockPayload.sub },
        data: dto,
      });

      expect(result).toEqual({
        status: ResponseStatus.SUCCESS,
        message: 'User successfully updated.',
        data: mockUser,
      });
    });
  });

  describe('Log out feature', () => {
    it('Should set rt hash to null and return success message', async () => {
      mockDatabaseService.user.update.mockResolvedValue(mockUser);

      const result = await service.userLogOut(mockPayload);

      expect(mockDatabaseService.user.update).toHaveBeenCalledWith({
        where: { id: mockPayload.sub },
        data: {
          rtHash: null,
        },
      });

      expect(result).toEqual({
        status: ResponseStatus.SUCCESS,
        message: 'User successfully logged out.',
      });
    });
  });
});
