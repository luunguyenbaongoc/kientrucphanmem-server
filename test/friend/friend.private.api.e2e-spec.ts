import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { Repository } from 'typeorm';
import { Friend, FriendRequest, User } from 'src/entities';
import { AuthService } from 'src/modules/http/auth/auth.service';
import { FriendRequestService } from 'src/modules/http/friend_request/friend_request.service';
import { resetUserDb, resetFriendDb } from 'test/db-utils';


describe('PrivateFriendAPI (e2e)', () => {
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

    for (let i = 0; i < friendPhones.length; i++) {
      const { id: requestId } = await friendRequestService.makeRequest(
        userId,
        {
          to_user_phone: friendPhones[i],
        },
      );
      await friendRequestService.acceptRequest(requestId);
    }
  });

  it('/friend (GET)', async () => {
    /*
     * Test retrieving all friends of a user.
     */
    await request(app.getHttpServer())
      .get('/friend')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body).toHaveLength(friendPhones.length);
        response.body.forEach(friend => {
          expect(friendUserIds).toContain(friend.to_user_profile.id);
          expect(friend.to_user_profile.profile[0].fullname).toMatch(/^John [0-3] Doe$/);
        });
      });
  });

  it('/delete/:delete_user_id (DELETE)', async () => {
    /*
     * Test deleting a friend of a user successfully.
     */
    await request(app.getHttpServer())
      .delete(`/friend/delete/${friendUserIds[0]}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.text).toEqual('true');
      });
      await request(app.getHttpServer())
        .get('/friend')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK)
        .expect((response) => {
          expect(response.body).toHaveLength(friendPhones.length - 1)
          expect(response.body.map(item => item.to_user_profile.id)).not.toContain(friendUserIds[0]);
        });
  });

  it('/delete/:delete_user_id (DELETE)', async () => {
    /*
     * Test delete friendship unsuccessfully with user who is not you're friend.
     */
    const {
      user: { id: unknownUser },
    } = await authService.register({
      fullname: `Unknown User`,
      phone: '055312044',
      password: password,
    });
    await request(app.getHttpServer())
      .delete(`/friend/delete/${unknownUser}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('/friend/find-by-text (POST)', async () => {
    /*
     * Test searching friends of user by friend's name using Regex.
     */
    await request(app.getHttpServer())
      .post('/friend/find-by-text')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ text: 'Doe' })
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body).toHaveLength(friendPhones.length);
        response.body.forEach(friend => {
          expect(friendUserIds).toContain(friend.to_user_profile.id);
          expect(friend.to_user_profile.profile[0].fullname).toMatch(/^John [0-3] Doe$/);
        });
      });
    
    await request(app.getHttpServer())
      .post('/friend/find-by-text')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ text: '2 Doe' })
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body).toHaveLength(1);
        expect(friendUserIds).toContain(response.body[0].to_user_profile.id);
        expect(response.body[0].to_user_profile.profile[0].fullname).toEqual('John 2 Doe');
      });
  });

  it('/friend/find-by-text (POST)', async () => {
    /*
     * Test searching user's friends by phone number using regex.
     */
    await request(app.getHttpServer())
      .post('/friend/find-by-text')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ text: '5678' })
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body).toHaveLength(2);
        response.body.forEach(friend => {
          expect(friendUserIds).toContain(friend.to_user_profile.id);
          expect(friend.to_user_profile.profile[0].fullname).toMatch(/^John [0-1] Doe$/);
        });
      });
  });

  afterEach(async () => {
    await resetUserDb(userRepository);
    await resetFriendDb(friendRepository, friendRequestRepository);
  });

  afterAll(async () => {
    await app.close();
  });
});
