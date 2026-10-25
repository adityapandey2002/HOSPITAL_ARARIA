import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    findByPhone: jest.fn(),
    findByIdOrNull: jest.fn(),
    findByIdWithPassword: jest.fn(),
    create: jest.fn(),
    updatePassword: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        'jwt.secret': 'test-secret',
        'jwt.accessTokenExpiry': '15m',
        'jwt.refreshTokenExpiry': '7d',
        'jwt.issuer': 'dh-araria',
        'jwt.audience': 'dh-araria-users',
      };
      return config[key] ?? defaultValue;
    }),
    getOrThrow: jest.fn((key: string) => {
      const config: Record<string, string> = { 'jwt.secret': 'test-secret' };
      const value = config[key];
      if (!value) throw new Error(`Missing configuration key: ${key}`);
      return value;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
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
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.findByPhone.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockUsersService.create.mockResolvedValue({
        id: 'user-id',
        email: registerDto.email,
        name: registerDto.name,
        phone: registerDto.phone,
        role: 'PATIENT',
        isActive: true,
        abhaId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
      expect(result.user).toHaveProperty('email', registerDto.email);
      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: registerDto.email,
          password: 'hashed-password',
          role: 'PATIENT',
        })
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: 'existing-user' });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if phone already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.findByPhone.mockResolvedValue({ id: 'existing-user' });

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
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
      expect(result.user).toHaveProperty('email', loginDto.email);
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const payload = {
        sub: 'user-id',
        email: 'test@example.com',
        role: 'PATIENT',
        typ: 'refresh',
      };

      mockJwtService.verify.mockReturnValue(payload);
      mockUsersService.findByIdOrNull.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        role: 'PATIENT',
        isActive: true,
      });
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

    it('rejects an access token presented at the refresh endpoint', async () => {
      // Both token kinds share a signing secret, so the `typ` claim is the only
      // thing preventing a short-lived access token from minting new tokens.
      mockJwtService.verify.mockReturnValue({
        sub: 'user-id',
        email: 'test@example.com',
        role: 'PATIENT',
        typ: 'access',
      });

      await expect(service.refreshTokens('an-access-token')).rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.findByIdOrNull).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return user for valid payload', async () => {
      const payload = { sub: 'user-id', email: 'test@example.com', role: 'PATIENT' };
      const mockUser = { id: 'user-id', email: 'test@example.com', isActive: true };

      mockUsersService.findByIdOrNull.mockResolvedValue(mockUser);

      const result = await service.validateUser(payload);

      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      const payload = { sub: 'user-id', email: 'test@example.com', role: 'PATIENT' };

      mockUsersService.findByIdOrNull.mockResolvedValue(null);

      await expect(service.validateUser(payload)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changePassword', () => {
    it('should reject an incorrect current password', async () => {
      mockUsersService.findByIdWithPassword.mockResolvedValue({
        id: 'user-id',
        password: 'hashed-password',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword('user-id', 'wrong', 'NewPass123!')).rejects.toThrow(
        Error
      );
      expect(mockUsersService.updatePassword).not.toHaveBeenCalled();
    });

    it('should persist a new password when the current one matches', async () => {
      mockUsersService.findByIdWithPassword.mockResolvedValue({
        id: 'user-id',
        password: 'hashed-password',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.changePassword('user-id', 'correct', 'NewPass123!');

      expect(result).toEqual({ success: true, message: 'Password changed successfully' });
      expect(mockUsersService.updatePassword).toHaveBeenCalledWith('user-id', 'NewPass123!');
    });
  });

  describe('forgotPassword', () => {
    it('returns the same message for an unknown address and signs nothing', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword('nobody@example.com');

      expect(result).toEqual({
        success: true,
        message: 'If the email exists, a reset link has been sent',
      });
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('binds the token to the password hash and exposes it only in development', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'user-id',
        email: 'test@example.com',
        password: 'hashed-password',
        isActive: true,
      });
      mockJwtService.sign.mockReturnValue('reset-token');

      const result = await service.forgotPassword('test@example.com');

      expect(result).toMatchObject({ success: true, resetToken: 'reset-token' });
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'user-id',
          email: 'test@example.com',
          purpose: 'password-reset',
          pwd: expect.any(String),
        }),
        expect.objectContaining({ secret: 'test-secret:password-reset', expiresIn: '15m' })
      );
    });
  });

  describe('resetPassword', () => {
    const fixedFingerprint = createHash('sha256')
      .update('hashed-password')
      .digest('hex')
      .slice(0, 32);

    it('rejects a token that does not verify', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.resetPassword('bad-token', 'NewPass123!')).rejects.toThrow(
        BadRequestException
      );
      expect(mockUsersService.updatePassword).not.toHaveBeenCalled();
    });

    it('rejects a token whose password fingerprint is stale', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-id',
        email: 'test@example.com',
        purpose: 'password-reset',
        pwd: 'stale-fingerprint',
      });
      mockUsersService.findByIdWithPassword.mockResolvedValue({
        id: 'user-id',
        password: 'hashed-password',
        isActive: true,
      });

      await expect(service.resetPassword('token', 'NewPass123!')).rejects.toThrow(
        BadRequestException
      );
      expect(mockUsersService.updatePassword).not.toHaveBeenCalled();
    });

    it('updates the password when the token matches', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'user-id',
        email: 'test@example.com',
        purpose: 'password-reset',
        pwd: fixedFingerprint,
      });
      mockUsersService.findByIdWithPassword.mockResolvedValue({
        id: 'user-id',
        password: 'hashed-password',
        isActive: true,
      });

      const result = await service.resetPassword('token', 'NewPass123!');

      expect(result).toEqual({ success: true, message: 'Password reset successfully' });
      expect(mockUsersService.updatePassword).toHaveBeenCalledWith('user-id', 'NewPass123!');
    });
  });
});
