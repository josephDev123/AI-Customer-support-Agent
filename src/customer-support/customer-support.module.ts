import { Module } from '@nestjs/common';
import { CustomerSupportController } from './http/customer-support.controller';
import { CustomerSupportService } from './application/customer-support.service';
import {
  CUSTOMER_SUPPORT_REPOSITORY,
  InMemoryCustomerSupportRepository,
} from './infrastructure/customer-support.repository';

@Module({
  controllers: [CustomerSupportController],
  providers: [
    CustomerSupportService,
    {
      provide: CUSTOMER_SUPPORT_REPOSITORY,
      useClass: InMemoryCustomerSupportRepository,
    },
  ],
  exports: [CustomerSupportService],
})
export class CustomerSupportModule {}
