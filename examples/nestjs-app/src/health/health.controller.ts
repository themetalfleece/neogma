import { NeogmaService } from '@neogma/nest';
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  constructor(private readonly neogmaService: NeogmaService) {}

  @Get()
  async check() {
    try {
      await this.neogmaService.neogma.verifyConnectivity();
      return { status: 'ok', neo4j: 'connected' };
    } catch {
      return { status: 'error', neo4j: 'disconnected' };
    }
  }
}
