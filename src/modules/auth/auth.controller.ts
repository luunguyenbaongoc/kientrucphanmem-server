import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { Public } from 'src/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Get('/check-user-exist/:phone')
  checkUserExistByPhone(@Param('phone') phone: string) {
    return this.authService.checkUserExistByPhone(phone);
  }
}
