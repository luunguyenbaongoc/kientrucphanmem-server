import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { Repository } from 'typeorm';
import { Group, User } from 'src/entities';
import { AuthService } from 'src/modules/auth/auth.service';
import { FriendRequestService } from 'src/modules/friend_request/friend_request.service';
import { GroupMembers } from 'src/entities/group_members.entity';
import { 
  resetUserDb,
  resetGroupDb
} from 'test/db-utils';
import * as fs from 'fs';
import * as path from 'path';


describe('PrivateGroupAPI (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let groupRepository: Repository<Group>;
  let groupMembersRepository: Repository<GroupMembers>
  let authService: AuthService;
  let friendRequestService: FriendRequestService;
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
    groupRepository = app.get('GroupRepository');
    groupMembersRepository = app.get('GroupMembersRepository');
    authService = app.get<AuthService>(AuthService);
    friendRequestService = app.get<FriendRequestService>(FriendRequestService);
    await resetUserDb(userRepository);
    await resetGroupDb(groupRepository);
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
    const { access_token, user: { id }} = response.body;
    accessToken = access_token;
    userId = id;
  });

  it('/group (POST)', async () => {
    /*
    * Test create new group with only admin user successfully.
    */
    const name: string = "Group 1";
    await request(app.getHttpServer())
      .post('/group')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name, description: "This is group 1" })
      .expect(HttpStatus.CREATED)
      .expect((response) => {
        expect(response.body.name).toEqual(name);
        expect(response.body.description).toEqual("This is group 1");
        expect(response.body.created_by).toEqual(userId);
        expect(response.body.avatar).toMatch(/^\/9j\/4AAQSkZJRgABAQEBLAEsAAD/,);
      });
  });

  it('/group (POST)', async () => {
    /*
    * Test create new group unsuccessfully with more users
    * but they are not friend of admin user.
    */
    const { user: { id: moreUserId } } = await authService.register({
      fullname: 'David Luis',
      phone: "012345678",
      password: password,
    });

    const name: string = "Group 1";
    await request(app.getHttpServer())
      .post('/group')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name, description: "This is group 1", user_ids: [ moreUserId ] })
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('/group (POST)', async () => {
    /*
    * Test create new group successfully with more users
    * who are friend of admin user.
    */
    const { user: { id: moreUserId } } = await authService.register({
      fullname: 'David Luis',
      phone: "012345678",
      password: password,
    });

    const { id: requestId } = await friendRequestService.makeRequest(
      userId, { to_user_phone: "012345678" });
    await friendRequestService.acceptRequest(requestId);

    const name: string = "Group 1";
    const response = await request(app.getHttpServer())
      .post('/group')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name, description: "This is group 1", user_ids: [ moreUserId ] })
      .expect(HttpStatus.CREATED)
      .expect((response) => {
        expect(response.body.name).toEqual(name);
        expect(response.body.description).toEqual("This is group 1");
        expect(response.body.created_by).toEqual(userId);
        expect(response.body.avatar).toMatch(/^\/9j\/4AAQSkZJRgABAQEBLAEsAAD/,);
      });
      // Expect admin user and another user exists in the group.
      const groupMembers = await groupMembersRepository.find({ 
        where: { group_id: response.body.id } });
      expect(groupMembers).toHaveLength(2);
  });

  it('/group (PUT)', async () => {
    /*
    * Test updating group information.
    */
    const name: string = "Group 1";
    const response = await request(app.getHttpServer())
      .post('/group')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name, description: "This is group 1" })
      .expect(HttpStatus.CREATED)

    // const base64Image = fs.readFileSync(
    //   path.join(__dirname, '../../src/images/default-avatar1.jpg'),
    //   'base64',
    // );
    await request(app.getHttpServer())
      .put(`/group/${response.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ description: "This is group 2" })
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body.name).toEqual(name);
        expect(response.body.description).toEqual("This is group 2");
        expect(response.body.created_by).toEqual(userId);
        // expect(response.body.avatar).toEqual(base64Image);
      });
  });

  afterEach(async () => {
    await resetGroupDb(groupRepository);
    await resetUserDb(userRepository);
  });

  afterAll(async () => {
    await app.close();
  });
});
