// Example test for Auth Service
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { UnauthorizedException, ConflictException } from '@nestjs/common';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'jwt.secret': 'test-secret',
        'jwt.accessTokenExpiry': '15m',
        'jwt.refreshTokenExpiry': '7d',
        'jwt.issuer': 'dh-araria',
        'jwt.audience': 'dh-araria-users',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      name: 'Test User',
      phone: '+919876543210',
    };

    it('should register a new user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-id',
        ...registerDto,
        password: 'hashed-password',
        role: 'PATIENT',
        createdAt: new Date(),
      });
      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
      expect(result.user).toHaveProperty('email', registerDto.email);
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if phone already exists', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce({ id: 'existing-user' }); // phone check

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'SecurePass123!',
    };

    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      password: 'hashed-password',
      name: 'Test User',
      phone: '+919876543210',
      role: 'PATIENT',
      isActive: true,
      abhaId: null,
    };

    it('should login successfully with valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
      expect(result.user).toHaveProperty('email', loginDto.email);
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const payload = { sub: 'user-id', email: 'test@example.com', role: 'PATIENT' };

      mockJwtService.verify.mockReturnValue(payload);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-id', isActive: true });
      mockJwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = await service.refreshTokens(refreshToken);

      expect(result).toHaveProperty('accessToken', 'new-access-token');
      expect(result).toHaveProperty('refreshToken', 'new-refresh-token');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshTokens('invalid-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user for valid payload', async () => {
      const payload = { sub: 'user-id', email: 'test@example.com', role: 'PATIENT' };
      const mockUser = { id: 'user-id', email: 'test@example.com', isActive: true };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser(payload);

      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      const payload = { sub: 'user-id', email: 'test@example.com', role: 'PATIENT' };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser(payload)).rejects.toThrow(UnauthorizedException);
    });
  });
});