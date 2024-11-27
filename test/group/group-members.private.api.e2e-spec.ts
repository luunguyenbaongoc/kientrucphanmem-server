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
import { GroupMembersService } from 'src/modules/http/group_members/group_members.service';
import { GroupStatusCode } from 'src/utils/enums';
import { GroupStatusService } from 'src/modules/http/group_status/group_status.service';

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
  let groupMemberService: GroupMembersService;
  let groupStatusService: GroupStatusService;
  let accessToken: string;
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
    groupMemberService = app.get<GroupMembersService>(GroupMembersService);
    groupStatusService = app.get<GroupStatusService>(GroupStatusService);
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
      access_token,
      user: { id },
    } = response.body;
    accessToken = access_token;
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
        expect(response.body).not.toHaveProperty('password');
        response.body.forEach(
          ({ created_by, user_id, group_id, created_date }, index: number) => {
            expect(created_by).toEqual(adminUserId);
            expect(user_id).toEqual(userIds[2 + index]);
            expect(group_id).toEqual(groupId);
            expect(new Date(created_date).getDate()).toEqual(
              new Date().getDate(),
            );
          },
        );
      });
    const members = await groupMembersRepository.find({
      where: { group_id: groupId },
    });
    expect(members).toHaveLength(5); // include admin user.
  });

  it('/group-members (POST)', async () => {
    /*
     * Test add user into the group unsuccessfully since added user is
     * not friend of admin user.
     */
    const otherUserPhone: string = '000000000';
    const {
      user: { id: otherUserId },
    } = await authService.register({
      fullname: 'Other user',
      phone: otherUserPhone,
      password: password,
    });

    const groupId: string = groupIds[0];
    await request(app.getHttpServer())
      .post('/group-members')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ group_id: groupId, user_ids: [otherUserId] })
      .expect(HttpStatus.BAD_REQUEST);

    const members = await groupMembersRepository.find({
      where: { group_id: groupId },
    });
    expect(members).toHaveLength(3); // include admin user.
  });

  // it('/group-members (POST)', async () => {
  //   /*
  //    * Test an unrelavant person trying to add people into a group unsuccessfully.
  //    * This user is also not a member of that group. But they are friend of each other.
  //    */
  //   const {
  //     body: {
  //       access_token,
  //       user: { id },
  //     },
  //   } = await request(app.getHttpServer())
  //     .post('/auth/login')
  //     .send({ phone: userPhones[0], password });

  //   const { id: requestId } = await friendRequestService.makeRequest(id, {
  //     to_user_phone: userPhones[1],
  //   });
  //   await friendRequestService.acceptRequest(requestId);

  //   const groupId: string = groupIds[1];
  //   await request(app.getHttpServer())
  //     .post('/group-members')
  //     .set('Authorization', `Bearer ${access_token}`)
  //     .send({ group_id: groupId, user_ids: [userIds[1]] })
  //     .expect(HttpStatus.BAD_REQUEST);

  //   const members = await groupMembersRepository.find({
  //     where: { group_id: groupId },
  //   });
  //   expect(members).toHaveLength(3);
  // });

  it('/group-members/remove-members (POST)', async () => {
    /*
     * Test remove member from group successfully.
     */
    const groupId: string = groupIds[1];
    await request(app.getHttpServer())
      .post('/group-members/remove-members')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ group_id: groupId, user_ids: [userIds[2]] })
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.text).toEqual('true');
      });

    const members = await groupMembersRepository.find({
      where: { group_id: groupId },
    });
    expect(members).toHaveLength(2);
  });

  it('/group-members/remove-members (POST)', async () => {
    /*
     * Test remove member from group unsuccessfully because removed users
     * are not group members.
     */
    const groupId: string = groupIds[1];
    await request(app.getHttpServer())
      .post('/group-members/remove-members')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ group_id: groupId, user_ids: [userIds[0], userIds[1]] })
      .expect(HttpStatus.OK);

    const members = await groupMembersRepository.find({
      where: { group_id: groupId },
    });
    expect(members).toHaveLength(3);
  });

  it('/group-members/list-by-user (POST)', async () => {
    /*
     * Test retrieving group members by search text. search text is empty means
     * return all groups of the request user.
     */
    await request(app.getHttpServer())
      .post('/group-members/list-by-user')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ searchText: '' })
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body.count).toEqual(2);
        expect(response.body.groups).toHaveLength(2);
        response.body.groups.forEach((group, index: number) => {
          expect(group.user_id).toEqual(adminUserId);
          expect(group.group_id).toEqual(groupIds[index]);
          expect(group.group.name).toEqual(groupNames[index]);
          expect(group).not.toHaveProperty('user');
        });
      });

    await request(app.getHttpServer())
      .post('/group-members/list-by-user')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ searchText: 'Group' })
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body.count).toEqual(2);
        expect(response.body.groups).toHaveLength(2);
      });

    await request(app.getHttpServer())
      .post('/group-members/list-by-user')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ searchText: '1' })
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body.count).toEqual(1);
        expect(response.body.groups).toHaveLength(1);
      });

    await request(app.getHttpServer())
      .post('/group-members/list-by-user')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ searchText: 'ABC' })
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body.count).toEqual(0);
        expect(response.body.groups).toHaveLength(0);
      });
  });

  it('/group-members/list-by-group/:group_id (GET)', async () => {
    /*
     * Test retrieving all members of a specific group.
     */
    await request(app.getHttpServer())
      .get(`/group-members/list-by-group/${groupIds[1]}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body.count).toEqual(3);
        expect(response.body.users).toHaveLength(3);
        const groupUserIds: string[] = [adminUserId, userIds[2], userIds[3]];
        const groupUserNames: string[] = ['John Doe 2', 'John Doe 3', 'Admin'];
        response.body.users.sort(u => u.user.profile[0].fullname).forEach((groupMember, index: number) => {
          expect(groupUserIds).toContain(groupMember.user_id);
          expect(groupMember.group_id).toEqual(groupIds[1]);
          expect(groupMember.user).not.toHaveProperty('password');
          expect(groupUserNames).toContain(
            groupMember.user.profile[0].fullname,
          );
          expect(groupMember.user.profile[0].fullname).toEqual(
            groupUserNames[index],
          );
        });
      });
  });

  it('/leave-group/:group_id (Get)', async () => {
    /*
     * Test normal member of a group leave that group.
     */
    const {
      body: { access_token },
    } = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone: userPhones[0], password });

    const groupId: string = groupIds[0];
    await request(app.getHttpServer())
      .get(`/group-members/leave-group/${groupId}`)
      .set('Authorization', `Bearer ${access_token}`)
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.text).toEqual('true');
      });

    const members = await groupMembersRepository.find({
      where: { group_id: groupId },
    });
    expect(members).toHaveLength(2);
  });

  it('/leave-group/:group_id (Get)', async () => {
    /*
     * Test admin user of a group trying to leave that group.
     * Expect the group still has members so promote one of them to
     * be a group owner.
     */
    const groupId: string = groupIds[0];
    await request(app.getHttpServer())
      .get(`/group-members/leave-group/${groupId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.text).toEqual('true');
      });

    const members = await groupMembersRepository.find({
      where: { group_id: groupId },
    });
    expect(members).toHaveLength(2);
    const group = await groupRepository.findOne({ where: { id: groupId}});
    const { id } = await groupStatusService.findByCode(GroupStatusCode.ACTIVE);
    expect([userIds[0], userIds[1]]).toContain(group.owner_id);
    expect(group.group_status_id).toEqual(id);
  });

  it('/leave-group/:group_id (Get)', async () => {
    /*
     * Test admin user trying to leave the of of only him left.
     * Expect the group status should be INACTIVE.
     */
    const groupId: string = groupIds[0];
    await groupMemberService.removeMembers(adminUserId, { 
      group_id: groupId, 
      user_ids: [ userIds[0], userIds[1] ] 
    });
    expect(await groupMembersRepository.find({
      where: { group_id: groupId },
    })
    ).toHaveLength(1);
    await request(app.getHttpServer())
      .get(`/group-members/leave-group/${groupId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.text).toEqual('true');
      });

    const members = await groupMembersRepository.find({
      where: { group_id: groupId },
    });
    expect(members).toHaveLength(0);
    const group = await groupRepository.findOne({ where: { id: groupId}});
    const { id } = await groupStatusService.findByCode(GroupStatusCode.INACTIVE);
    expect(group.group_status_id).toEqual(id);
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
