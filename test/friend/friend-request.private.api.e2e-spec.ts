import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { Repository } from 'typeorm';
import { Friend, FriendRequest, User } from 'src/entities';
import { AuthService } from 'src/modules/http/auth/auth.service';
import { FriendRequestService } from 'src/modules/http/friend_request/friend_request.service';
import { resetUserDb, resetFriendDb } from 'test/db-utils';
import { FriendRequestStatusCode } from 'src/utils/enums';
import { FriendRequestStatusService } from 'src/modules/http/friend_request_status/friend_request_status.service';


describe('PrivateFriendRequestAPI (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let friendRepository: Repository<Friend>;
  let friendRequestRepository: Repository<FriendRequest>;
  let authService: AuthService;
  let friendRequestService: FriendRequestService;
  let friendRequestStatusService: FriendRequestStatusService
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
    friendRequestStatusService = app.get<FriendRequestStatusService>(FriendRequestStatusService);
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
    const status = await friendRequestStatusService.findByCodeAndCheckExist(FriendRequestStatusCode.PENDING);
    const response = await request(app.getHttpServer())
      .post('/friend-request')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ to_user_phone: friendPhones[0] })
      .expect(HttpStatus.CREATED)
      .expect((response) => {
        expect(response.body.from_user).toEqual(userId);
        expect(response.body.to_user).toEqual(friendUserIds[0]);
        expect(response.body.friend_request_status_id).toEqual(status.id);
      });
    
    const friendRequest = await friendRequestService.findByContitions(
      userId,
      friendUserIds[0],
      FriendRequestStatusCode.PENDING,
    );
    expect(friendRequest.id).toEqual(response.body.id);
  });

  it('/friend-request (GET)', async () => {
    /*
     * Test make friend request to user who doesn't exist.
     */
    await request(app.getHttpServer())
      .post('/friend-request')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ to_user_phone: '03122333333' })
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('/friend-request/list-sent (GET)', async () => {
    /*
     * Test retrieve all requests you have sent to others.
     */
    let requestIds: string[] = [];
    for (let i = 0; i < friendPhones.length; i++) {
      const { id } = await friendRequestService.makeRequest(
        userId,
        {
          to_user_phone: friendPhones[i],
        },
      );
      if (i === 0) {
        await friendRequestService.acceptRequest(id);
      }
      requestIds.push(id);
    }
    await request(app.getHttpServer())
      .get('/friend-request/list-sent')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body.length).toEqual(friendPhones.length - 1);
        response.body.forEach(request => {
          expect(requestIds).toContain(request.id);
          expect(friendUserIds).toContain(request.to_user_profile.id);
        });
        expect(response.body.map(item => item.to_user_profile.id)).not.toContain(friendUserIds[0]);
      });;
  });

  it('/friend-request/list-received (GET)', async () => {
    /*
     * Test retrieve all requests you have received from others.
     */
    let requestIds: string[] = [];
    let acceptedRequestId: string;
    for (let i = 0; i < friendPhones.length; i++) {
      const { id } = await friendRequestService.makeRequest(
        friendUserIds[i],
        {
          to_user_phone: userPhone,
        },
      );
      if (i === 0) {
        const { id: acceptedId } = await friendRequestService.acceptRequest(id);
        acceptedRequestId = acceptedId;
      }
      requestIds.push(id);
    }
    await request(app.getHttpServer())
      .get('/friend-request/list-received')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body.length).toEqual(friendPhones.length - 1);
        response.body.forEach(request => {
          expect(requestIds).toContain(request.id);
          expect(friendUserIds).toContain(request.from_user_profile.id);
        });
        expect(response.body.map(item => item.id)).not.toContain(acceptedRequestId);
      });
  });

  it('/friend-request/accept/:request_id (GET)', async () => {
    /*
     * Test accept request from other.
     */
    let requestIds: string[] = [];
    for (let i = 0; i < friendPhones.length; i++) {
      const { id } = await friendRequestService.makeRequest(
        friendUserIds[i],
        {
          to_user_phone: userPhone,
        },
      );
      requestIds.push(id);
    }
    await request(app.getHttpServer())
      .get(`/friend-request/accept/${requestIds[0]}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body.from_user).toEqual(friendUserIds[0]);
        expect(response.body.to_user).toEqual(userId);
      });
    
    await request(app.getHttpServer())
    .get('/friend')
    .set('Authorization', `Bearer ${accessToken}`)
    .expect(HttpStatus.OK)
    .expect((response) => {
      expect(response.body).toHaveLength(1);
      expect(response.body[0].to_user_profile.id).toEqual(friendUserIds[0])
    });
  });

  // it('/friend-request/accept/:request_id (GET)', async () => {
  //   /*
  //    * Test try to accept the friend request using other access token.
  //    */
  //   let requestIds: string[] = [];
  //   for (let i = 0; i < friendPhones.length; i++) {
  //     const { id } = await friendRequestService.makeRequest(
  //       friendUserIds[i],
  //       {
  //         to_user_phone: userPhone,
  //       },
  //     );
  //     requestIds.push(id);
  //   }
  //   const response = await request(app.getHttpServer())
  //     .post('/auth/login')
  //     .send({ phone: friendPhones[0], password })
  //     .expect(HttpStatus.OK);
  //   const { access_token } = response.body;
  //   await request(app.getHttpServer())
  //     .get(`/friend-request/accept/${requestIds[0]}`)
  //     .set('Authorization', `Bearer ${access_token}`)
  //     .expect(HttpStatus.BAD_REQUEST);
    
  //   await request(app.getHttpServer())
  //   .get('/friend')
  //   .set('Authorization', `Bearer ${accessToken}`)
  //   .expect(HttpStatus.OK)
  //   .expect((response) => {
  //     expect(response.body).toHaveLength(0);
  //   });
  // });

  afterEach(async () => {
    await resetUserDb(userRepository);
    await resetFriendDb(friendRepository, friendRequestRepository);
  });

  afterAll(async () => {
    await app.close();
  });
});
