import { NeogmaModule } from '@neogma/nest';
import { Module } from '@nestjs/common';

import { HealthModule } from './health';
import { UsersModule } from './users';

@Module({
  imports: [
    NeogmaModule.forRoot({
      connection: {
        url: process.env.NEO4J_URL ?? 'bolt://localhost:7687',
        username: process.env.NEO4J_USERNAME ?? 'neo4j',
        password: process.env.NEO4J_PASSWORD ?? 'password',
      },
    }),
    HealthModule,
    UsersModule,
  ],
})
export class AppModule {}
