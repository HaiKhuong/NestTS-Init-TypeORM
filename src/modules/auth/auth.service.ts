import { ForgotService } from '@admin/forgot/forgot.service';
import { Role } from '@admin/roles/entities/role.entity';
import { RoleEnum } from '@admin/roles/roles.enum';
import { User } from '@admin/users/entities/user.entity';
import { UsersService } from '@admin/users/users.service';
import { SocialInterface } from '@auth-social/interfaces/social.interface';
import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { plainToClass } from 'class-transformer';
import * as crypto from 'crypto';
import { MailService } from 'src/mail/mail.service';
import { AuthProvidersEnum } from './auth-providers.enum';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { AuthUpdateDto } from './dto/auth-update.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private forgotService: ForgotService,
    private mailService: MailService,
  ) {}

  async validateLogin(loginDto: AuthEmailLoginDto, onlyAdmin: boolean): Promise<{ token: string; user: User }> {
    const user = await this.usersService.findOne({ email: loginDto.email });

    if (!user || (user && !(onlyAdmin ? [RoleEnum.admin] : [RoleEnum.user]).includes(user.role.id))) {
      throw new HttpException({ status: HttpStatus.NOT_FOUND, errors: { email: 'notFound' } }, HttpStatus.NOT_FOUND);
    }

    if (user.provider !== AuthProvidersEnum.email) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: { email: `needLoginViaProvider:${user.provider}` },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const isValidPassword = await bcrypt.compare(loginDto.password, user.password);

    if (isValidPassword) {
      const token = await this.jwtService.sign({
        id: user.id,
        role: user.role,
      });

      return { token, user: user };
    } else {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            password: 'incorrectPassword',
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async validateSocialLogin(authProvider: string, socialData: SocialInterface): Promise<{ token: string; user: User }> {
    let user: User;
    const socialEmail = socialData.email?.toLowerCase();

    const userByEmail = await this.usersService.findOne({
      email: socialEmail,
    });

    user = await this.usersService.findOne({
      socialId: socialData.id,
      provider: authProvider,
    });

    if (user) {
      if (socialEmail && !userByEmail) {
        user.email = socialEmail;
      }
      await this.usersService.update(user.id, user);
    } else if (userByEmail) {
      user = userByEmail;
    } else {
      const role = plainToClass(Role, {
        id: RoleEnum.user,
      });

      user = await this.usersService.create({
        email: socialEmail,
        firstName: socialData.firstName,
        lastName: socialData.lastName,
        socialId: socialData.id,
        provider: authProvider,
        status: 'ACTIVE',
        role,
      });

      user = await this.usersService.findOne({
        id: user.id,
      });
    }

    const jwtToken = await this.jwtService.sign({
      id: user.id,
      role: user.role,
    });

    return {
      token: jwtToken,
      user,
    };
  }

  async register(dto: AuthRegisterLoginDto): Promise<void> {
    try {
      const hash = crypto.createHash('sha256').update(randomStringGenerator()).digest('hex');

      const user = await this.usersService.create({
        ...dto,
        email: dto.email,
        role: { id: RoleEnum.user } as Role,
        status: 'ACTIVE',
        hash,
      });

      await this.mailService.userSignUp({
        to: user.email,
        data: {
          hash,
        },
      });
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async confirmEmail(hash: string): Promise<void> {
    const user = await this.usersService.findOne({ hash });

    if (!user) {
      throw new NotFoundException('');
    }

    user.hash = null;
    user.status = 'ACTIVE';
    await user.save();
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findOne({
      email,
    });

    if (!user) {
      throw new NotFoundException('emailNotExists');
    } else {
      const hash = crypto.createHash('sha256').update(randomStringGenerator()).digest('hex');
      await this.forgotService.create({ hash, user });

      await this.mailService.forgotPassword({
        to: email,
        data: {
          hash,
        },
      });
    }
  }

  async resetPassword(hash: string, password: string): Promise<void> {
    const forgot = await this.forgotService.findOne({ where: { hash } });

    if (!forgot) {
      throw new NotFoundException('notFound');
    }

    const user = forgot.user;
    user.password = password;
    await user.save();
    await this.forgotService.softDelete(forgot.id);
  }

  async me(user: User): Promise<User> {
    return this.usersService.findOne({ id: user.id });
  }

  async update(user: User, userDto: AuthUpdateDto): Promise<User> {
    if (userDto.password) {
      if (userDto.oldPassword) {
        const currentUser = await this.usersService.findOne({ id: user.id });

        const isValidOldPassword = await bcrypt.compare(userDto.oldPassword, currentUser.password);

        if (!isValidOldPassword) {
          throw new BadRequestException('incorrectOldPassword');
        }
      } else {
        throw new BadRequestException('missingOldPassword');
      }
    }

    await this.usersService.update(user.id, userDto);

    return this.usersService.findOne({
      id: user.id,
    });
  }

  async softDelete(user: User): Promise<void> {
    await this.usersService.softDelete(user.id);
  }
}
