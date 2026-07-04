import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import type { OrderModel, UserModel } from '../models';
import { ORDER_MODEL_TOKEN, USER_MODEL_TOKEN } from '../models';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(USER_MODEL_TOKEN)
    private readonly Users: UserModel,
    @Inject(ORDER_MODEL_TOKEN)
    private readonly Orders: OrderModel,
  ) {
    this.logger.log('NestUser and NestOrder models injected');
  }

  async create(dto: CreateUserDto) {
    const user = await this.Users.createOne({
      id: dto.id,
      name: dto.name,
      email: dto.email,
      age: dto.age,
    });
    return this.toPlain(user);
  }

  async findAll() {
    const users = await this.Users.findMany();
    return users.map((u) => this.toPlain(u));
  }

  async findOne(id: string) {
    const user = await this.Users.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    return this.toPlain(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    // Build update data with only the fields that were provided.
    // Passing undefined values would generate SET clauses with unbound
    // parameters, causing a Neo4j ParameterMissing error.
    const data: Parameters<UserModel['update']>[0] = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.age !== undefined) data.age = dto.age;

    const [updated] = await this.Users.update(data, {
      where: { id },
      return: true,
    });
    if (updated.length === 0) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }
    return this.toPlain(updated[0]);
  }

  async remove(id: string): Promise<number> {
    return this.Users.delete({ where: { id }, detach: true });
  }

  async removeAll(): Promise<number> {
    const count = await this.Users.delete({
      where: {},
      detach: true,
    });
    const orderCount = await this.Orders.delete({
      where: {},
      detach: true,
    });
    return count + orderCount;
  }

  private toPlain(instance: { dataValues: Record<string, unknown> }) {
    return instance.dataValues;
  }
}
