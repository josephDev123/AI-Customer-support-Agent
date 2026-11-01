import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CustomerSupportRepository } from '../repository/customer-support.repository.js';
import type { CreateHumanEscalationTicketDto } from '../dto/customer-question.dto.js';
import { Prisma } from '../../../generated/prisma/client.js';

@Injectable()
export class CustomerSupportService {
  private readonly logger = new Logger(CustomerSupportService.name);

  constructor(
    private readonly customerSupportRepository: CustomerSupportRepository,
  ) {}

  async createHumanEscalationTicket(data: CreateHumanEscalationTicketDto) {
    try {
      return await this.customerSupportRepository.createHumanEscalationTicket(
        data,
      );
    } catch (error) {
      throw this.mapDatabaseError(error);
    }
  }

  private mapDatabaseError(error: unknown): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2000':
        case 'P2003':
        case 'P2011':
          return new BadRequestException(
            'The escalation ticket contains invalid database values.',
          );
        case 'P2002':
          return new ConflictException(
            'A human escalation ticket already exists for this customer question.',
          );
        case 'P2025':
          return new NotFoundException('The requested ticket was not found.');
        case 'P2024':
          return new ServiceUnavailableException(
            'The database is busy. Please try again shortly.',
          );
        case 'P1001':
        case 'P1002':
        case 'P1017':
          return new ServiceUnavailableException(
            'The database is temporarily unavailable. Please try again shortly.',
          );
        default:
          this.logDatabaseError(error);
          return new InternalServerErrorException(
            'We could not create the escalation ticket.',
          );
      }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      return new BadRequestException(
        'The escalation ticket contains invalid data.',
      );
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      this.logDatabaseError(error);
      return new ServiceUnavailableException(
        'The database is temporarily unavailable. Please try again shortly.',
      );
    }

    this.logDatabaseError(error);
    return new InternalServerErrorException(
      'We could not create the escalation ticket.',
    );
  }

  private logDatabaseError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.error(message);
  }
}
