import { Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('sync/trigger-all')
  async triggerSync() {
    return this.appService.triggerAllSyncs();
  }
}
