import { Body, Controller, Post } from '@nestjs/common';
import { CustomerSupportService } from '../application/customer-support.service';

@Controller('agent')
export class CustomerSupportController {
  constructor(private readonly customerSupportService: CustomerSupportService) {}

  @Post('question')
  askQuestion(@Body() body: unknown) {
    return this.customerSupportService.handleCustomerQuestion(body);
  }
}
