import { Module } from '@nestjs/common';
import { CustomerSupportController } from './controller/customer-support.controller.js';
import { CustomerSupportService } from './service/customer-support.service.js';
import { CustomerSupportRepository } from './repository/customer-support.repository.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [CustomerSupportController],
  providers: [CustomerSupportService, CustomerSupportRepository],
  exports: [CustomerSupportService],
})
export class CustomerSupportModule {}
