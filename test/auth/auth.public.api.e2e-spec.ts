import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { Repository } from 'typeorm';
import { User } from 'src/entities';
import { AuthService } from 'src/modules/http/auth/auth.service';
import { resetUserDb } from 'test/db-utils';


describe('PublicAuthAPI (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let authService: AuthService;
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
  });

  it('/auth/check-user-exist/:phone (GET)', async () => {
    /*
     * Test check if user exists.
     */
    await request(app.getHttpServer())
      .get(`/auth/check-user-exist/012345678`)
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.text).toEqual('false');
      });

    await request(app.getHttpServer())
      .get(`/auth/check-user-exist/${existingPhone}`)
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.text).toEqual('true');
      });
  });

  it('/auth/register (POST)', () => {
    /*
     * Test register new user successfully.
     */
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ fullname: 'John Doe', phone: '012345678', password })
      .expect(HttpStatus.CREATED)
      .expect((response) => {
        expect(response.body).toEqual({
          error: null,
          is_success: true,
          user: {
            id: expect.stringMatching(
              /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89a-b][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/,
            ),
          },
        });
      });
  });

  it('/auth/register (POST)', async () => {
    /*
     * Test register unsuccessfully since user with that phone number already exists/
     */
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ fullname: 'John Doe 1', phone: existingPhone, password })
      .expect(HttpStatus.BAD_REQUEST);

    expect(response.body).toEqual({
      message: `${`Người dùng ${existingPhone} đã tồn tại`}`,
      statusCode: HttpStatus.BAD_REQUEST,
    });
  });

  it('/auth/login (POST)', async () => {
    /*
     * Test login successfully.
     */
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone: existingPhone, password })
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body.error).toBeNull();
        expect(response.body.is_success).toBe(true);
        expect(response.body.user.id).toMatch(
          /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89a-b][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/,
        );

        expect(response.body.access_token).toBeDefined();
        expect(typeof response.body.access_token).toBe('string');
        expect(response.body.access_token.length).toBeGreaterThan(0);

        expect(response.body.refresh_token).toBeDefined();
        expect(typeof response.body.refresh_token).toBe('string');
        expect(response.body.refresh_token.length).toBeGreaterThan(0);
        // Expect password not present in the response body
        expect(response.body.password).toBeUndefined();
      });
  });

  it('/auth/login (POST)', async () => {
    /*
     * Test login unsuccessfully because user with phone number was not registered
     * in the database.
     */
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone: '123455334', password })
      .expect(HttpStatus.BAD_REQUEST);
  });

  afterEach(async () => {
    await resetUserDb(userRepository);
  });

  afterAll(async () => {
    await app.close();
  });
});
