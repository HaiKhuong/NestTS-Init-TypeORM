import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityCondition } from '@utils/types/entity-condition.type';
import { IPaginationOptions } from '@utils/types/pagination-options';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  create(createProfileDto: CreateUserDto) {
    return this.usersRepository.save(this.usersRepository.create(createProfileDto));
  }

  async findAll(pagination: IPaginationOptions) {
    try {
      const { skip, take } = pagination;
      const [data, total] = await this.usersRepository.findAndCount({
        skip: skip,
        take: take,
      });
      const i18n = I18nContext.current();
      console.log(i18n.t('validation.IMAGE_NOT_EXIST'));

      return {
        data,
        pagination: {
          total,
          page: pagination.page,
          pageSize: pagination.pageSize,
        },
      };
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  findOne(fields: EntityCondition<User>) {
    return this.usersRepository.findOne({
      where: fields,
    });
  }

  update(id: number, updateProfileDto: UpdateUserDto) {
    return this.usersRepository.save(
      this.usersRepository.create({
        id,
        ...updateProfileDto,
      }),
    );
  }

  async softDelete(id: number): Promise<void> {
    await this.usersRepository.softDelete(id);
  }
}
