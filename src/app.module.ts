import appConfig from '@config/app.config';
import appleConfig from '@config/apple.config';
import authConfig from '@config/auth.config';
import databaseConfig from '@config/database.config';
import facebookConfig from '@config/facebook.config';
import fileConfig from '@config/file.config';
import googleConfig from '@config/google.config';
import mailConfig from '@config/mail.config';
import { FilesModule } from '@admin/files/files.module';
import { ForgotModule } from '@admin/forgot/forgot.module';
import { UsersModule } from '@admin/users/users.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthAppleModule } from '@auth-social/auth-apple/auth-apple.module';
import { AuthFacebookModule } from '@auth-social/auth-facebook/auth-facebook.module';
import { AuthGoogleModule } from '@auth-social/auth-google/auth-google.module';
import { AuthModule } from '@auth/auth.module';
import { HeaderResolver } from 'nestjs-i18n';
import { I18nModule } from 'nestjs-i18n/dist/i18n.module';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { TypeOrmConfigService } from '@database/typeorm-config.service';
import { MailConfigService } from '@mail/mail-config.service';
import { MailModule } from '@mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, authConfig, appConfig, mailConfig, fileConfig, facebookConfig, googleConfig, appleConfig],
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options) => {
        const dataSource = await new DataSource(options).initialize();
        return dataSource;
      },
    }),
    MailerModule.forRootAsync({
      useClass: MailConfigService,
    }),
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        fallbackLanguage: configService.get('app.fallbackLanguage'),
        loaderOptions: { path: path.join(__dirname, '/i18n/'), watch: true },
        logging: false, // Disable Log I18n
      }),
      resolvers: [
        {
          use: HeaderResolver,
          useFactory: (configService: ConfigService) => {
            return [configService.get('app.headerLanguage')];
          },
          inject: [ConfigService],
        },
      ],
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    UsersModule,
    FilesModule,
    AuthModule,
    AuthFacebookModule,
    AuthGoogleModule,
    AuthAppleModule,
    ForgotModule,
    MailModule,
  ],
})
export class AppModule {}
