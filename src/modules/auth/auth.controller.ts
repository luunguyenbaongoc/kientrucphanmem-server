import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { Public, AuthUser, RefreshToken } from 'src/decorators';
import {
  LogInDto,
  RevokeRefreshDto,
  RefreshDto,
  ResetPasswordDto,
  RegisterDto,
} from './dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Get('check-user-exist/:phone')
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  checkUserExistByPhone(@Param('phone') phone: string) {
    return this.authService.checkUserExistByPhone(phone);
  }

  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiConsumes('application/json', 'application/x-www-form-urlencoded')
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

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('revoke-refresh')
  revokeRefresh(@Body() revokeRefreshDto: RevokeRefreshDto) {
    return this.authService.revokeRefreshToken(revokeRefreshDto);
  }
}
