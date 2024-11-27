import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { Repository } from 'typeorm';
import { Friend, FriendRequest, User } from 'src/entities';
import { AuthService } from 'src/modules/http/auth/auth.service';
import { FriendRequestService } from 'src/modules/http/friend_request/friend_request.service';
import { resetUserDb, resetFriendDb } from 'test/db-utils';


describe('PrivateFriendRequestAPI (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let friendRepository: Repository<Friend>;
  let friendRequestRepository: Repository<FriendRequest>;
  let authService: AuthService;
  let friendRequestService: FriendRequestService;
  let accessToken: string;
  let userId: string;
  const userPhone: string = '012345678';
  const friendPhones: string[] = [
    '123456789',
    '123456788',
    '123456777',
    '123456666',
  ];
  let friendUserIds: string[];
  const password: string = 'test-user-123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userRepository = app.get('UserRepository');
    friendRepository = app.get('FriendRepository');
    friendRequestRepository = app.get('FriendRequestRepository');
    authService = app.get<AuthService>(AuthService);
    friendRequestService = app.get<FriendRequestService>(FriendRequestService);
    await resetUserDb(userRepository);
    await resetFriendDb(friendRepository, friendRequestRepository);
    await app.init();
  });

  beforeEach(async () => {
    await authService.register({
      fullname: 'Test User',
      phone: userPhone,
      password: password,
    });
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone: userPhone, password })
      .expect(HttpStatus.OK);
    const {
      access_token,
      user: { id },
    } = response.body;
    accessToken = access_token;
    userId = id;

    friendUserIds = [];
    for (let i: number = 0; i < friendPhones.length; i++) {
      const {
        user: { id },
      } = await authService.register({
        fullname: `John ${i} Doe`,
        phone: friendPhones[i],
        password: password,
      });
      friendUserIds.push(id);
    }
  });

  it('/friend-request (GET)', async () => {
    /*
     * Test make friend request to another user.
     */
    await request(app.getHttpServer())
      .post('/friend-request')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ to_user_phone: friendPhones[0] })
      .expect(HttpStatus.CREATED);
  });

  afterEach(async () => {
    await resetUserDb(userRepository);
    await resetFriendDb(friendRepository, friendRequestRepository);
  });

  afterAll(async () => {
    await app.close();
  });
});
