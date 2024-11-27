import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { Repository } from 'typeorm';
import { Friend, FriendRequest, Group, User } from 'src/entities';
import { AuthService } from 'src/modules/http/auth/auth.service';
import { FriendRequestService } from 'src/modules/http/friend_request/friend_request.service';
import { GroupMembers } from 'src/entities/group_members.entity';
import { resetUserDb, resetGroupDb, resetFriendDb } from 'test/db-utils';
import { GroupService } from 'src/modules/http/group/group.service';

describe('PublicGroupMembersAPI (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let groupRepository: Repository<Group>;
  let friendRepository: Repository<Friend>;
  let friendRequestRepository: Repository<FriendRequest>;
  let groupMembersRepository: Repository<GroupMembers>;
  let authService: AuthService;
  let friendRequestService: FriendRequestService;
  let groupService: GroupService;
  let adminUserId: string;
  const adminPhone: string = '0339876543';
  let groupIds: string[];
  let userIds: string[];
  const groupNames: string[] = ['Group 1', 'Group 2'];
  const userPhones: string[] = [
    '123456789',
    '123456788',
    '123456777',
    '123456666',
  ];
  const password: string = 'test-user-123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userRepository = app.get('UserRepository');
    groupRepository = app.get('GroupRepository');
    friendRepository = app.get('FriendRepository');
    friendRequestRepository = app.get('FriendRequestRepository');
    groupMembersRepository = app.get('GroupMembersRepository');
    authService = app.get<AuthService>(AuthService);
    friendRequestService = app.get<FriendRequestService>(FriendRequestService);
    groupService = app.get<GroupService>(GroupService);
    await resetUserDb(userRepository);
    await resetFriendDb(friendRepository, friendRequestRepository);
    await resetGroupDb(groupRepository, groupMembersRepository);
    await app.init();
  });

  beforeEach(async () => {
    userIds = [];
    groupIds = [];
    for (let i: number = 0; i < userPhones.length; i++) {
      const {
        user: { id },
      } = await authService.register({
        fullname: `John Doe ${i}`,
        phone: userPhones[i],
        password: password,
      });
      userIds.push(id);
    }

    await authService.register({
      fullname: 'Admin',
      phone: adminPhone,
      password: password,
    });
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone: adminPhone, password });
    const {
      user: { id },
    } = response.body;
    adminUserId = id;
    // Make friend for user and admin (DO NOT user forEach here because it may cause problems
    // with consistency of database).
    for (let i = 0; i < userPhones.length; i++) {
      const { id: requestId } = await friendRequestService.makeRequest(
        adminUserId,
        {
          to_user_phone: userPhones[i],
        },
      );
      await friendRequestService.acceptRequest(requestId);
    }
    // Create 2 groups the first 2 users in group 1 and 2 others left in group 2.
    for (let i = 0; i < groupNames.length; i++) {
      const { id: group_id } = await groupService.addGroup(adminUserId, {
        name: groupNames[i],
        description: `This is description for group ${i}`,
        user_ids: [userIds[2 * i], userIds[2 * i + 1]],
      } as any);
      groupIds.push(group_id);
    }
  });

  it('/group-members/remove-members (POST)', async () => {
    /*
     * Test remove member from group unsuccessfully because you're not authorized
     * to remove members from this group.
     */
    const {
      body: { access_token },
    } = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone: userPhones[2], password });

    const groupId: string = groupIds[1];
    await request(app.getHttpServer())
      .post('/group-members/remove-members')
      .set('Authorization', `Bearer ${access_token}`)
      .send({ group_id: groupId, user_ids: [adminUserId, userIds[3]] })
      .expect(HttpStatus.UNAUTHORIZED);

    const members = await groupMembersRepository.find({
      where: { group_id: groupId },
    });
    expect(members).toHaveLength(3);
  });

  it('/group-members/remove-members (POST)', async () => {
    /*
     * Test remove member not from group unsuccessfully.
     */
    const {
      body: { access_token },
    } = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone: userPhones[2], password });

    const groupId: string = groupIds[1];
    await request(app.getHttpServer())
      .post('/group-members/remove-members')
      .set('Authorization', `Bearer ${access_token}`)
      .send({ group_id: groupId, user_ids: [adminUserId, userIds[1]] })
      .expect(HttpStatus.UNAUTHORIZED);

    const members = await groupMembersRepository.find({
      where: { group_id: groupId },
    });
    expect(members).toHaveLength(3);
  });

  it('/leave-group/:group_id (Get)', async () => {
    /*
     * Test user who is not member of the group trying to 
     * request leaving group.
     */
    const {
      body: { access_token },
    } = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone: userPhones[0], password });

    const groupId: string = groupIds[1];
    await request(app.getHttpServer())
      .get(`/group-members/leave-group/${groupId}`)
      .set('Authorization', `Bearer ${access_token}`)
      .expect(HttpStatus.BAD_REQUEST);

    const members = await groupMembersRepository.find({
      where: { group_id: groupId },
    });
    expect(members).toHaveLength(3);
  });

  afterEach(async () => {
    await resetUserDb(userRepository);
    await resetFriendDb(friendRepository, friendRequestRepository);
    await resetGroupDb(groupRepository, groupMembersRepository);
  });

  afterAll(async () => {
    await app.close();
  });
});
