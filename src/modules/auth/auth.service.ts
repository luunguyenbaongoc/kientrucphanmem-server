import { Injectable, Logger } from '@nestjs/common';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UserService) {}

  async checkUserExistByPhone(phone: string): Promise<boolean> {
    try {
      const userByPhone = await this.usersService.findUserByPhone(phone);

      if (userByPhone) {
        return true;
      }
      return false;
    } catch (ex) {
      Logger.error(ex);
      return false;
    }
  }
}
