import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { NoticeExtractionService } from './notice-extraction.service';
import { NoticesController } from './notices.controller';
import { NoticesService } from './notices.service';

@Module({
  // ConfigModule is global in AppModule, but importing it here keeps the module
  // usable in isolation (tests, future extraction workers).
  imports: [ConfigModule],
  controllers: [NoticesController],
  providers: [NoticesService, NoticeExtractionService],
  exports: [NoticesService, NoticeExtractionService],
})
export class NoticesModule {}
