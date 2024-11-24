import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { Repository } from 'typeorm';
import { User } from 'src/entities';
import { AuthService } from 'src/modules/auth/auth.service';
import { resetUserDb } from 'test/db-utils';
import * as fs from 'fs';
import * as path from 'path';

describe('PublicUserAPI (e2e)', () => {
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
    const { refresh_token, access_token, user: { id }} = response.body;
    refreshToken = refresh_token;
    accessToken = access_token;
    userId = id;
  });

  it('/user/me/profiles (authenticated required) (GET)', async () => {
    /*
    * Test get user profile unsuccessfully.
    */
    await request(app.getHttpServer())
      .get('/user/me/profiles')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('/user/me/profiles (authenticated required) (POST)', async () => {
    /*
    * Test create new user profile unsuccessfully.
    */
    const base64Image = fs.readFileSync(
      path.join(__dirname, '../../src/images/default-avatar1.jpg'),
      'base64',
    );
    const fullname: string = "John Doe 1";
    await request(app.getHttpServer())
      .post('/user/me/profiles')
      .send({ fullname: fullname, avatar: base64Image })
      .expect(HttpStatus.UNAUTHORIZED);

    await request(app.getHttpServer())
      .get('/user/me/profiles')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body).toHaveLength(1);
      });
  });

  it('/profile/profiles/:profileId (authenticated required) (PATCH)', async () => {
    /*
    * Test update user profile unsuccessfully because of authentication required.
    */
    const base64Image = fs.readFileSync(
      path.join(__dirname, '../../src/images/default-avatar1.jpg'),
      'base64',
    );
    const response = await request(app.getHttpServer())
      .get('/user/me/profiles')
      .set('Authorization', `Bearer ${accessToken}`);

    await request(app.getHttpServer())
      .patch(`/profile/profiles/${response.body[0].id}`)
      .send({ fullname: 'Jane Doe 2', avatar: base64Image })
      .expect(HttpStatus.UNAUTHORIZED);

    await request(app.getHttpServer())
      .get('/user/me/profiles')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body).toHaveLength(1);
      });
  });

  afterEach(async () => {
    await resetUserDb(userRepository);
  });

  afterAll(async () => {
    await app.close();
  });
});
