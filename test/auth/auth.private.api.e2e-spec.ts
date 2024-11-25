import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { Repository } from 'typeorm';
import { User } from 'src/entities';
import { AuthService } from 'src/modules/auth/auth.service';
import { resetUserDb } from 'test/db-utils';

describe('PrivateAuthAPI (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let authService: AuthService;
  let refreshToken: string;
  let accessToken: string;
  let userId: string;
  const existingPhone: string = '123456789';
  const password: string = 'test-user-123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userRepository = app.get('UserRepository');
    authService = app.get<AuthService>(AuthService);
    await resetUserDb(userRepository);
    await app.init();
  });

  beforeEach(async () => {
    await authService.register({
      fullname: 'John Doe',
      phone: existingPhone,
      password: password,
    });
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone: existingPhone, password })
      .expect(HttpStatus.OK);
    const {
      refresh_token,
      access_token,
      user: { id },
    } = response.body;
    refreshToken = refresh_token;
    accessToken = access_token;
    userId = id;
  });

  it('/auth/logout (POST)', async () => {
    /*
     * Test logout sucessfully.
     */
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Refresh_token', refreshToken)
      .send({ userId, refresh_token: refreshToken })
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.text).toEqual('true');
      });
  });

  it('/auth/logout (POST)', async () => {
    /*
     * Test logout unsuccessfully because of lacking access token.
     */
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Refresh_token', refreshToken)
      .send({ userId, refresh_token: refreshToken })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  // it('/auth/reset-password (POST)', async () => {
  //   /*
  //   * Test reset password sucessfully with authentication required
  //   */
  //   await request(app.getHttpServer())
  //     .post('/auth/reset-password')
  //     .send({ phone: existingPhone, new_password: `${password}_new` })
  //     .expect(HttpStatus.UNAUTHORIZED);
  // });

  afterEach(async () => {
    await resetUserDb(userRepository);
  });

  afterAll(async () => {
    await app.close();
  });
});
