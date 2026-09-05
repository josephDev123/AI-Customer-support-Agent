import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { HumanMessage } from '@langchain/core/messages';
import { CustomerQuestionSchema } from '../dto/customer-question.dto';
import { agentGraph } from '../graphs';
import { AGENT_REPOSITORY, type AgentRepository } from '../infrastructure/agent.repository';
import { type AgentStateType } from '../states';

@Injectable()
export class AgentService {
  constructor(
    @Inject(AGENT_REPOSITORY)
    private readonly agentRepository: AgentRepository,
  ) {}

  async handleCustomerQuestion(payload: unknown) {
    const parsed = CustomerQuestionSchema.safeParse(payload);

    if (!parsed.success) {
      throw new BadRequestException('question is required');
    }

    const { question } = parsed.data;
    const run = await this.agentRepository.createRun(question);

    const result = (await agentGraph.invoke({
      customerQuestion: question,
      messages: [new HumanMessage(question)],
    })) as AgentStateType;

    await this.agentRepository.saveRun({
      ...run,
      result,
    });

    return {
      runId: run.id,
      ...result,
    };
  }
}
