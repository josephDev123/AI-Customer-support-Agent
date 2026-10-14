import { Body, Controller, Post } from '@nestjs/common';
import { CustomerSupportService } from '../application/customer-support.service';

@Controller('agent')
export class CustomerSupportController {
  constructor(
    private readonly customerSupportService: CustomerSupportService,
  ) {}

  @Post('question')
  async askQuestion(@Body() body: unknown) {
    const result =
      await this.customerSupportService.handleCustomerQuestion(body);
    return result;
  }
}
