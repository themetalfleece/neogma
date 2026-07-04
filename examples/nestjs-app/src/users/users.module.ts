import { NeogmaModule } from '@neogma/nest';
import { Module } from '@nestjs/common';

import { OrderNode, UserNode } from '../models';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    // Register decorated model classes — leaf dependencies first.
    NeogmaModule.forFeature([OrderNode, UserNode]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
