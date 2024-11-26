import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { Repository } from 'typeorm';
import { Group, User } from 'src/entities';
import { AuthService } from 'src/modules/auth/auth.service';
import { FriendRequestService } from 'src/modules/friend_request/friend_request.service';
import { GroupMembers } from 'src/entities/group_members.entity';
import { resetUserDb, resetGroupDb } from 'test/db-utils';
import * as fs from 'fs';
import * as path from 'path';
import { GroupService } from 'src/modules/group/group.service';
import { GroupStatusService } from 'src/modules/group_status/group_status.service';
import { GroupStatusCode } from 'src/utils/enums';

describe('PrivateGroupAPI (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let groupRepository: Repository<Group>;
  let groupMembersRepository: Repository<GroupMembers>;
  let authService: AuthService;
  let friendRequestService: FriendRequestService;
  let groupService: GroupService;
  let groupStatusService: GroupStatusService;
  let accessToken: string;
  let userId: string;
  let groupId: string;
  const groupName: string = 'Group 2';
  const groupDescription: string = 'This is group 2';
  let groupStatusId: string;
  const existingPhone: string = '123456789';
  const password: string = 'test-user-123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userRepository = app.get('UserRepository');
    groupRepository = app.get('GroupRepository');
    groupMembersRepository = app.get('GroupMembersRepository');
    authService = app.get<AuthService>(AuthService);
    friendRequestService = app.get<FriendRequestService>(FriendRequestService);
    groupService = app.get<GroupService>(GroupService);
    groupStatusService = app.get<GroupStatusService>(GroupStatusService);
    await resetUserDb(userRepository);
    await resetGroupDb(groupRepository, groupMembersRepository);
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
    // Initialize a group.
    const { id: group_id, group_status_id: status_id } =
      await groupService.addGroup(userId, {
        name: groupName,
        description: groupDescription,
      } as any);
    groupId = group_id;
    groupStatusId = status_id;
  });

  it('/group (POST)', async () => {
    /*
     * Test create new group with only admin user successfully.
     */
    const name: string = 'Group 1';
    await request(app.getHttpServer())
      .post('/group')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name, description: 'This is group 1' })
      .expect(HttpStatus.CREATED)
      .expect((response) => {
        expect(response.body.name).toEqual(name);
        expect(response.body.description).toEqual('This is group 1');
        expect(response.body.created_by).toEqual(userId);
        expect(response.body.avatar).toMatch(/^\/9j\/4AAQSkZJRgABAQEBLAEsAAD/);
      });
  });

  it('/group (POST)', async () => {
    /*
     * Test create new group unsuccessfully with more users
     * but they are not friend of admin user.
     */
    const {
      user: { id: moreUserId },
    } = await authService.register({
      fullname: 'David Luis',
      phone: '012345678',
      password: password,
    });

    const name: string = 'Group 1';
    await request(app.getHttpServer())
      .post('/group')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name, description: 'This is group 1', user_ids: [moreUserId] })
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('/group (POST)', async () => {
    /*
     * Test create new group successfully with more users
     * who are friend of admin user.
     */
    const {
      user: { id: moreUserId },
    } = await authService.register({
      fullname: 'David Luis',
      phone: '012345678',
      password: password,
    });

    const { id: requestId } = await friendRequestService.makeRequest(userId, {
      to_user_phone: '012345678',
    });
    await friendRequestService.acceptRequest(requestId);

    const name: string = 'Group 1';
    const response = await request(app.getHttpServer())
      .post('/group')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name, description: 'This is group 1', user_ids: [moreUserId] })
      .expect(HttpStatus.CREATED)
      .expect((response) => {
        expect(response.body.name).toEqual(name);
        expect(response.body.description).toEqual('This is group 1');
        expect(response.body.created_by).toEqual(userId);
        expect(response.body.avatar).toMatch(/^\/9j\/4AAQSkZJRgABAQEBLAEsAAD/);
      });
    // Expect admin user and another user exists in the group.
    const groupMembers = await groupMembersRepository.find({
      where: { group_id: response.body.id },
    });
    expect(groupMembers).toHaveLength(2);
  });

  it('/group/:id (PUT)', async () => {
    /*
     * Test updating group information.
     */
    const base64Image = fs.readFileSync(
      path.join(__dirname, '../../src/images/default-avatar1.jpg'),
      'base64',
    );
    await request(app.getHttpServer())
      .put(`/group/${groupId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Group 4',
        description: 'This is group 4',
        avatar: base64Image,
        group_status_code: 'active',
      })
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body.name).toEqual('Group 4');
        expect(response.body.description).toEqual('This is group 4');
        expect(response.body.created_by).toEqual(userId);
        expect(response.body.avatar).toEqual(base64Image);
        expect(response.body.group_status_id).toEqual(groupStatusId);
      });
  });

  it('/group/:id (PUT)', async () => {
    /*
     * Test updating group information unsuccessfully since
     * lack of key in payload.
     */
    await request(app.getHttpServer())
      .put(`/group/${groupId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Group 4',
        description: 'This is group 4',
        group_status_code: 'active',
      })
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('/group/:id (DELETE)', async () => {
    /*
     * Test deleting group successfully with grou admin account
     * without more users in the group.
     */
    await request(app.getHttpServer())
      .delete(`/group/${groupId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.NO_CONTENT);
    const { id } = await groupStatusService.findByCode(
      GroupStatusCode.INACTIVE,
    );
    const group: Group = await groupService.findById(groupId);
    expect(group.group_status_id).toEqual(id);
  });

  it('/group/:id (DELETE)', async () => {
    /*
     * Test deleting group successfully with grou admin account
     * with more users in the group.
     */
    const {
      user: { id: moreUserId },
    } = await authService.register({
      fullname: 'David Luis',
      phone: '012345678',
      password: password,
    });

    const { id: requestId } = await friendRequestService.makeRequest(userId, {
      to_user_phone: '012345678',
    });
    await friendRequestService.acceptRequest(requestId);

    const name: string = 'Group 1';
    const response = await request(app.getHttpServer())
      .post('/group')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name, description: 'This is group 1', user_ids: [moreUserId] })
      .expect(HttpStatus.CREATED);

    const newGroupId: string = response.body.id;
    // Expect admin user and another user exists in the group.
    const groupMembers = await groupMembersRepository.find({
      where: { group_id: newGroupId },
    });
    expect(groupMembers).toHaveLength(2);

    await request(app.getHttpServer())
      .delete(`/group/${newGroupId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.NO_CONTENT);
    const { id } = await groupStatusService.findByCode(
      GroupStatusCode.INACTIVE,
    );
    const group: Group = await groupService.findById(newGroupId);
    expect(group.group_status_id).toEqual(id);

    // Delete group mean remove all users of that group from GroupMembers.
    const groupMembersAfter = await groupMembersRepository.find({
      where: { group_id: newGroupId },
    });
    expect(groupMembersAfter).toHaveLength(0);
  });

  it('/group/:id (DELETE)', async () => {
    /*
     * Test deleting group unsuccessfully (unauthorized) because delete action
     * issued by non-admin user.
     */
    const {
      user: { id: moreUserId },
    } = await authService.register({
      fullname: 'David Luis',
      phone: '012345678',
      password: password,
    });

    const { id: requestId } = await friendRequestService.makeRequest(userId, {
      to_user_phone: '012345678',
    });
    await friendRequestService.acceptRequest(requestId);

    const name: string = 'Group 1';
    const response = await request(app.getHttpServer())
      .post('/group')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name, description: 'This is group 1', user_ids: [moreUserId] })
      .expect(HttpStatus.CREATED);

    // Login as a non-admin user and try to delet group.
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone: existingPhone, password })
      .expect(HttpStatus.OK);
    const { access_token: otherAccessToken } = response.body;

    const newGroupId: string = response.body.id;
    await request(app.getHttpServer())
      .delete(`/group/${newGroupId}`)
      .set('Authorization', `Bearer ${otherAccessToken}`)
      .expect(HttpStatus.UNAUTHORIZED);

    const { id } = await groupStatusService.findByCode(GroupStatusCode.ACTIVE);
    const group: Group = await groupService.findById(newGroupId);
    expect(group.group_status_id).toEqual(id);
  });

  afterEach(async () => {
    await resetGroupDb(groupRepository, groupMembersRepository);
    await resetUserDb(userRepository);
  });

  afterAll(async () => {
    await app.close();
  });
});
