import { Module } from '@nestjs/common';
import { CustomerSupportController } from './controller/customer-support.controller.js';
import { CustomerSupportService } from './service/customer-support.service.js';
import { CustomerSupportRepository } from './repository/customer-support.repository.js';

@Module({
  controllers: [CustomerSupportController],
  providers: [CustomerSupportService, CustomerSupportRepository],
  exports: [CustomerSupportService],
})
export class CustomerSupportModule {}
