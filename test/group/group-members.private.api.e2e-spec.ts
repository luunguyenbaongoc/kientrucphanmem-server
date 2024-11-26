import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { Repository } from 'typeorm';
import { Friend, FriendRequest, Group, User } from 'src/entities';
import { AuthService } from 'src/modules/auth/auth.service';
import { FriendRequestService } from 'src/modules/friend_request/friend_request.service';
import { GroupMembers } from 'src/entities/group_members.entity';
import { 
  resetUserDb, 
  resetGroupDb, 
  resetFriendDb 
} from 'test/db-utils';
import { GroupService } from 'src/modules/group/group.service';
import { GroupStatusService } from 'src/modules/group_status/group_status.service';

describe('PrivateGroupMembersAPI (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let groupRepository: Repository<Group>;
  let friendRepository: Repository<Friend>;
  let friendRequestRepository: Repository<FriendRequest>;
  let groupMembersRepository: Repository<GroupMembers>;
  let authService: AuthService;
  let friendRequestService: FriendRequestService;
  let groupService: GroupService;
  let groupStatusService: GroupStatusService;
  let accessToken: string;
  let adminUserId: string;
  const adminPhone: string = '0339876543';
  let groupIds: string[] = [];
  let userIds: string[] = [];
  const groupNames: string[] = ['Group 1', 'Group 2'];
  const userPhones: string[] = ['123456789', '123456788', '123456777', '123456666'];
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
    groupStatusService = app.get<GroupStatusService>(GroupStatusService);
    await resetGroupDb(groupRepository);
    await resetUserDb(userRepository);
    await resetFriendDb(friendRepository, friendRequestRepository);
    await app.init();
  });

  beforeEach(async () => {
    userPhones.forEach(async (phone, index) =>{
      const { user: { id } } = await authService.register({
        fullname: `John Doe ${index}`,
        phone: phone,
        password: password,
      });
      userIds.push(id);
    });
    await authService.register({
      fullname: 'Admin',
      phone: adminPhone,
      password: password,
    });
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone: adminPhone, password });
    const {
      access_token,
      user: { id },
    } = response.body;
    accessToken = access_token;
    adminUserId = id;
    // Make friend for user and admin (DO NOT user forEach here because it may cause problems
    // with consistency of database).
    for (let i = 0; i < userPhones.length; i++) {
      const { id: requestId } = await friendRequestService.makeRequest(adminUserId, {
        to_user_phone: userPhones[i],
      });
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

  it('/group-members (POST)', async () => {
    /*
     * Test add more user into the group 1.
     */
    const groupId: string = groupIds[0];
    await request(app.getHttpServer())
      .post('/group-members')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ group_id: groupId, user_ids: [userIds[2], userIds[3]] })
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body).toHaveLength(2);
        response.body.forEach(({ created_by, user_id, group_id, created_date }, index: number) => {
          expect(created_by).toEqual(adminUserId);
          expect(user_id).toEqual(userIds[2 + index]);
          expect(group_id).toEqual(groupId);
          expect(new Date(created_date).getDate()).toEqual(new Date().getDate());
        });
      });
  });

  afterEach(async () => {
    await resetFriendDb(friendRepository, friendRequestRepository);
    await resetGroupDb(groupRepository);
    await resetUserDb(userRepository);
  });

  afterAll(async () => {
    await app.close();
  });
});
