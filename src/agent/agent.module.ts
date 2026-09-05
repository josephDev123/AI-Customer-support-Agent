import { Module } from '@nestjs/common';
import { AgentController } from './http/agent.controller';
import { AgentService } from './application/agent.service';
import {
  AGENT_REPOSITORY,
  InMemoryAgentRepository,
} from './infrastructure/agent.repository';

@Module({
  controllers: [AgentController],
  providers: [
    AgentService,
    {
      provide: AGENT_REPOSITORY,
      useClass: InMemoryAgentRepository,
    },
  ],
  exports: [AgentService],
})
export class AgentModule {}
