import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { Repository } from 'typeorm';
import { Group, User } from 'src/entities';
import { AuthService } from 'src/modules/http/auth/auth.service';
import { resetUserDb, resetGroupDb } from 'test/db-utils';
import * as fs from 'fs';
import * as path from 'path';
import { GroupService } from 'src/modules/http/group/group.service';
import { GroupStatusService } from 'src/modules/http/group_status/group_status.service';
import { GroupStatusCode } from 'src/utils/enums';
import { GroupMembers } from 'src/entities/group_members.entity';


describe('PublicGroupAPI (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let groupRepository: Repository<Group>;
  let groupMembersRepository: Repository<GroupMembers>;
  let authService: AuthService;
  let groupService: GroupService;
  let groupStatusService: GroupStatusService;
  let userId: string;
  let groupId: string;
  const groupName: string = 'Group 2';
  const groupDescription: string = 'This is group 2';
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
      user: { id },
    } = response.body;

    userId = id;
    // Initialize a group.
    const { id: group_id } = await groupService.addGroup(userId, {
      name: groupName,
      description: groupDescription,
    } as any);
    groupId = group_id;
  });

  it('/group (POST)', async () => {
    /*
     * Test create new group with only admin user successfully.
     */
    const name: string = 'Group 1';
    await request(app.getHttpServer())
      .post('/group')
      .send({ name, description: 'This is group 1' })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('/group/:id (PUT)', async () => {
    /*
     * Test updating group information unsuccessfully because of
     * unauthenticated user.
     */
    const base64Image = fs.readFileSync(
      path.join(__dirname, '../../src/images/default-avatar1.jpg'),
      'base64',
    );
    await request(app.getHttpServer())
      .put(`/group/${groupId}`)
      .send({
        name: 'Group 4',
        description: 'This is group 4',
        avatar: base64Image,
        group_status_code: 'active',
      })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('/group/:id (DELETE)', async () => {
    /*
     * Test delete group unsuccessfully because of unauthenticated user.
     */
    await request(app.getHttpServer())
      .delete(`/group/${groupId}`)
      .expect(HttpStatus.UNAUTHORIZED);
    const { id } = await groupStatusService.findByCode(GroupStatusCode.ACTIVE);
    const group: Group = await groupService.findById(groupId);
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
