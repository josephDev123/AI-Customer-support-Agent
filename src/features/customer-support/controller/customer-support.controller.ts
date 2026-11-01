import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { CustomerSupportService } from '../service/customer-support.service.js';
import { CreateHumanEscalationTicketSchema } from '../dto/customer-question.dto.js';

@Controller()
export class CustomerSupportController {
  constructor(
    private readonly customerSupportService: CustomerSupportService,
  ) {}

  @Post('human-escalation-tickets')
  async createHumanEscalationTicket(@Body() body: unknown) {
    const parsed = CreateHumanEscalationTicketSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues);
    }

    return this.customerSupportService.createHumanEscalationTicket(parsed.data);
  }
}
