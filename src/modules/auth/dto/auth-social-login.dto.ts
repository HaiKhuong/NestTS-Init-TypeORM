import { ApiProperty } from '@nestjs/swagger';
import { Allow, IsNotEmpty } from 'class-validator';
import { AuthProvidersEnum } from '../auth-providers.enum';

export class Tokens {
  @ApiProperty()
  @IsNotEmpty()
  token1: string;

  @Allow()
  @ApiProperty()
  token2?: string;
}

export class AuthSocialLoginDto {
  @Allow()
  @ApiProperty({ type: () => Tokens })
  tokens: Tokens;

  @ApiProperty({ enum: AuthProvidersEnum })
  @IsNotEmpty()
  socialType: AuthProvidersEnum;

  @Allow()
  @ApiProperty({ required: false })
  firstName?: string;

  @Allow()
  @ApiProperty({ required: false })
  lastName?: string;
}
