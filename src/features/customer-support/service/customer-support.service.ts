import { Injectable } from '@nestjs/common';
import { CustomerSupportRepository } from '../repository/customer-support.repository.js';

@Injectable()
export class CustomerSupportService {
  constructor(
    private readonly customerSupportRepository: CustomerSupportRepository,
  ) {}

  async handleCustomerQuestion() {}
}
