import { Module } from '@nestjs/common';
import { LangGraphServerController } from './langgraph-server.controller.js';
import { LangGraphServerService } from './langgraph-server.service.js';

@Module({
  controllers: [LangGraphServerController],
  providers: [LangGraphServerService],
  exports: [LangGraphServerService],
})
export class LangGraphServerModule {}
