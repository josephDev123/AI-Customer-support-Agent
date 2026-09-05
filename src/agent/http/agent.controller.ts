import { Body, Controller, Post } from '@nestjs/common';
import { AgentService } from '../application/agent.service';

@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('question')
  askQuestion(@Body() body: unknown) {
    return this.agentService.handleCustomerQuestion(body);
  }
}
