import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

import { User as IUser } from '../models';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOne(name: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { name }});
    return user;
  }

  async createOne({ name, password }: IUser): Promise<User> {
    const user = this.userRepository.create({ name, password });
    await this.userRepository.save(user);
    return user;
  }
}
