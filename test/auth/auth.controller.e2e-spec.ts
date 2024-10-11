import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from 'src/modules/auth/auth.controller'; // Import AuthController
import { AuthService } from 'src/modules/auth/auth.service'; // Import AuthService
import { UserController } from 'src/modules/user/user.controller';
import { UserService } from 'src/modules/user/user.service';
import { UpdateProfileDto } from 'src/modules/user/dto';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  const userService = {
    updateProfile: jest.fn(),
  };
  const authService = {
    register: jest.fn(), // Mock the register method
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UserController, AuthController],
      providers: [
        {
          provide: UserService,
          useValue: userService,
        },
        {
          provide: AuthService, // Add AuthService mock here
          useValue: authService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('success case', async () => {
    const createProfileDto: UpdateProfileDto = {
      fullname: 'Johnathan Doe',
    };

    userService.updateProfile.mockResolvedValue({
      profile: createProfileDto,
    });

    authService.register.mockResolvedValue({
      profile: { fullname: 'John Doe' },
    });

    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        phone: '123',
        password: 'yourPassword',
        fullname: 'John Doe',
      })
      .expect(201) // Expect 201 Created since that's what you return in AuthController
      .expect((res) => {
        expect(res.body.profile.fullname).toBe('John Doe');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
