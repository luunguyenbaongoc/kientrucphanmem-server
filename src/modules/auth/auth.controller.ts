import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { Public } from 'src/decorators/public.decorator';
import { RegisterDto } from './dto/register.dto';
import { LogInDto } from './dto';
import { ResetPasswordDto } from './dto/resset-password.dto';
import { AuthUser, RefreshToken } from 'src/decorators/user.decorator';
import { RefreshDto } from './dto/refresh.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Get('check-user-exist/:phone')
  checkUserExistByPhone(@Param('phone') phone: string) {
    return this.authService.checkUserExistByPhone(phone);
  }

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  logIn(@Body() logInDto: LogInDto) {
    return this.authService.logIn(logInDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logOut(@AuthUser() userId: string, @RefreshToken() refreshToken: string) {
    return this.authService.logout(userId, refreshToken);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refresh(refreshDto);
  }
}
