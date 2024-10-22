import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from 'src/modules/auth/auth.service';
import { UserService } from 'src/modules/user/user.service';
import { User } from 'src/entities';
import { ProfileService } from 'src/modules/profile/profile.service';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByPhone: jest.fn(), // Mocking repository functions
            register: jest.fn(),
          },
        },
        {
          provide: ProfileService, // Mock ProfileService if it's a dependency
          useValue: {
            someProfileMethod: jest.fn(),
          },
        },
        {
          provide: DataSource, // Mocking the DataSource to avoid real DB interaction
          useValue: {
            manager: { save: jest.fn() }, // Mock any method you need from DataSource
          },
        },
        {
          provide: JwtService, // Mock JwtService if it's a dependency
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
  });

  describe('check-user-exist', () => {
    it('should successfully return false because user not exist', async () => {
      const phone = '123';
      jest.spyOn(userService, 'findByPhone').mockResolvedValue(null); // Mock no user found

      const result = await authService.checkUserExistByPhone(phone);

      expect(result).toEqual(false);
    });

    it('should return true because user already exists', async () => {
      const phone = '123';

      const user: User = new User();
      user.phone = '123';
      jest.spyOn(userService, 'findByPhone').mockResolvedValue(user);

      const result = await authService.checkUserExistByPhone(phone);

      expect(result).toEqual(true);
    });
  });
});
