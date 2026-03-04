import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Patch,
  ParseFilePipe,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthRequestSecurityService } from './services/auth-request-security.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly requestSecurity: AuthRequestSecurityService,
  ) { }

  /** POST /api/auth/login */
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.requestSecurity.assertTrustedOrigin(req);
    const payload = await this.authService.login(user);
    this.requestSecurity.setRefreshCookie(res, payload.refreshToken);
    return {
      user: payload.user,
      accessToken: payload.accessToken,
    };
  }

  /** POST /api/auth/refresh */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: Partial<RefreshTokenDto>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.requestSecurity.assertTrustedOrigin(req);
    const rawToken = this.requestSecurity.getRefreshToken(req, dto?.refreshToken);
    const payload = await this.authService.refresh(rawToken);
    this.requestSecurity.setRefreshCookie(res, payload.refreshToken);
    return {
      accessToken: payload.accessToken,
    };
  }

  /** POST /api/auth/logout */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() dto: Partial<RefreshTokenDto>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.requestSecurity.assertTrustedOrigin(req);
    const rawToken = this.requestSecurity.getRefreshToken(req, dto?.refreshToken);
    await this.authService.logout(rawToken);
    this.requestSecurity.clearRefreshCookie(res);
    return { message: 'Déconnecté avec succès' };
  }

  /** GET /api/auth/me */
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.id);
  }

  /** PATCH /api/auth/me */
  @Patch('me')
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
    @Req() req: Request,
  ) {
    this.requestSecurity.assertTrustedOrigin(req);
    return this.authService.updateMe(user.id, dto);
  }

  /** POST /api/auth/me/avatar */
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadMyAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Req() req: Request,
  ) {
    this.requestSecurity.assertTrustedOrigin(req);
    return this.authService.uploadMyAvatar(user.id, file);
  }

  /** POST /api/auth/forgot-password */
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    this.requestSecurity.assertTrustedOrigin(req);
    return this.authService.forgotPassword(dto.email);
  }

  /** POST /api/auth/reset-password */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    this.requestSecurity.assertTrustedOrigin(req);
    return this.authService.resetPassword(dto.email, dto.code, dto.password);
  }

  /** POST /api/auth/change-password */
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.requestSecurity.assertTrustedOrigin(req);
    const result = await this.authService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
    this.requestSecurity.clearRefreshCookie(res);
    return result;
  }
}
