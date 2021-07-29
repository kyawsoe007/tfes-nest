import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Req } from '@nestjs/common';
import { AppService } from './app.service';
// import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('Main')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // @UseGuards(JwtAuthGuard)
  @Get()
  getHello(@Req() req: Request): string {
    console.log('what is cookies', req.cookies);
    return this.appService.getHello();
  }
}
