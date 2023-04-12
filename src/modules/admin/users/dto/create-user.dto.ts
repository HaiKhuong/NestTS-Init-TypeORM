import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@admin/roles/entities/role.entity';
import { IsEmail, IsNotEmpty, IsOptional, MinLength, Validate } from 'class-validator';
import { IsNotExist } from '@utils/validators/is-not-exists.validator';
import { FileEntity } from '@admin/files/entities/file.entity';
import { IsExist } from '@utils/validators/is-exists.validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateUserDto {
  @ApiProperty({ example: 'test1@example.com' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsNotEmpty({ message: i18nValidationMessage('validation.IMAGE_NOT_EXIST') })
  @Validate(IsNotExist, ['User'], { message: 'emailAlreadyExists' })
  @IsEmail()
  email: string | null;

  @ApiProperty()
  @MinLength(6)
  password?: string;

  provider?: string;

  socialId?: string | null;

  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  firstName: string | null;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  lastName: string | null;

  @ApiProperty({ type: () => FileEntity })
  @IsOptional()
  @Validate(IsExist, ['FileEntity', 'id'], {
    message: i18nValidationMessage('validation.IMAGE_NOT_EXIST'),
  })
  photo?: FileEntity | null;

  @ApiProperty({ type: Role })
  @Validate(IsExist, ['Role', 'id'], { message: 'roleNotExists' })
  role?: Role | null;

  @ApiProperty({ example: 'INACTIVE' })
  @IsNotEmpty()
  status: string | null;

  hash?: string | null;
}
