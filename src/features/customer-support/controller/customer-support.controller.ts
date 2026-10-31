import { Body, Controller, Param, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CustomerSupportService } from '../service/customer-support.service.js';

@Controller()
export class CustomerSupportController {
  constructor(
    private readonly customerSupportService: CustomerSupportService,
  ) {}

  @Post('threads/:threadId/runs/stream')
  async streamRun(
    @Param('threadId') threadId: string,
    @Body() body: any,
    @Req() request: Request,
    @Res() response: Response,
  ) {}

  @Post('agent/question')
  async askQuestion(@Body() body: any) {}
}
