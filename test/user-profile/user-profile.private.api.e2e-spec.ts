import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { Repository } from 'typeorm';
import { User } from 'src/entities';
import { AuthService } from 'src/modules/http/auth/auth.service';
import { resetUserDb } from 'test/db-utils';
import * as fs from 'fs';
import * as path from 'path';


describe('PrivateUserAPI (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let authService: AuthService;
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
      access_token,
      user: { id },
    } = response.body;
    accessToken = access_token;
    userId = id;
  });

  it('/user/me/profiles (GET)', async () => {
    /*
     * Test get user profile successfully.
     */
    await request(app.getHttpServer())
      .get('/user/me/profiles')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body).toHaveLength(1);
        expect(response.body[0].fullname).toEqual('John Doe');
        expect(response.body[0].id).toMatch(
          /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89a-b][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/,
        );
        expect(response.body[0].user_id).toEqual(userId);
        expect(response.body[0].avatar).toMatch(
          /^\/9j\/4AAQSkZJRgABAQEBLAEsAAD/,
        );
      });
  });

  it('/user/me/profiles (POST)', async () => {
    /*
     * Test create new user profile successfully.
     */
    const base64Image = fs.readFileSync(
      path.join(__dirname, '../../src/images/default-avatar1.jpg'),
      'base64',
    );
    const fullname: string = 'John Doe 1';
    await request(app.getHttpServer())
      .post('/user/me/profiles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ fullname: fullname, avatar: base64Image })
      .expect(HttpStatus.CREATED)
      .expect((response) => {
        expect(response.body.fullname).toEqual(fullname);
        expect(response.body.avatar).toEqual(base64Image);
        expect(response.body.user_id).toEqual(userId);
      });
    await request(app.getHttpServer())
      .get('/user/me/profiles')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body).toHaveLength(2);
      });
  });

  it('/user/me/profiles (POST)', async () => {
    /*
     * Test create new user profile unsuccessfully because of upload large image
     */
    const base64Image = fs.readFileSync(
      path.join(__dirname, 'large-image.jpg'),
      'base64',
    );
    await request(app.getHttpServer())
      .post('/user/me/profiles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ fullname: 'Jane Doe 1', avatar: base64Image })
      .expect(HttpStatus.PAYLOAD_TOO_LARGE);
    await request(app.getHttpServer())
      .get('/user/me/profiles')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body).toHaveLength(1);
      });
  });

  it('/profile (Put)', async () => {
    // Create a dummy image for avatar
    const base64Image = fs.readFileSync(
      path.join(__dirname, '../../src/images/default-avatar1.jpg'),
      'base64',
    );
    const response = await request(app.getHttpServer())
      .get('/user/me/profiles')
      .set('Authorization', `Bearer ${accessToken}`);

    await request(app.getHttpServer())
      .put('/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ profileId: response.body[0].id, fullname: 'Jane Doe 2', avatar: base64Image })
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body.fullname).toEqual('Jane Doe 2');
        expect(response.body.avatar).toEqual(base64Image);
        expect(response.body.user_id).toEqual(userId);
      });

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
