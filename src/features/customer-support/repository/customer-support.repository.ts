import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CreateHumanEscalationTicketDto } from '../dto/customer-question.dto.js';

@Injectable()
export class CustomerSupportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createHumanEscalationTicket(data: CreateHumanEscalationTicketDto) {
    return this.prisma.humanEscalationTicket.create({
      data,
    });
  }
}
