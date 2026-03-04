import {
  Injectable,
} from '@nestjs/common';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AuthPasswordService } from './services/auth-password.service';
import { AuthProfileService } from './services/auth-profile.service';
import { AuthTokenService } from './services/auth-token.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly tokenService: AuthTokenService,
    private readonly profileService: AuthProfileService,
    private readonly passwordService: AuthPasswordService,
  ) { }

  async validateUser(email: string, password: string) {
    return this.tokenService.validateUser(email, password);
  }

  async login(user: AuthenticatedUser) {
    return this.tokenService.login(user);
  }

  async refresh(rawToken: string) {
    return this.tokenService.refresh(rawToken);
  }

  async logout(rawToken?: string): Promise<void> {
    return this.tokenService.logout(rawToken);
  }

  async getMe(userId: string) {
    return this.profileService.getMe(userId);
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    return this.profileService.updateMe(userId, dto);
  }

  async uploadMyAvatar(userId: string, file: Express.Multer.File) {
    return this.profileService.uploadMyAvatar(userId, file);
  }

  async forgotPassword(email: string) {
    return this.passwordService.forgotPassword(email);
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    return this.passwordService.resetPassword(email, code, newPassword);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    return this.passwordService.changePassword(userId, currentPassword, newPassword);
  }
}
