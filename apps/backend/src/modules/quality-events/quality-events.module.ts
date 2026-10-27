import { Module } from '@nestjs/common';
import { QualityEventsController } from './quality-events.controller';
import { QualityEventsService } from './quality-events.service';

@Module({
  controllers: [QualityEventsController],
  providers: [QualityEventsService],
  exports: [QualityEventsService],
})
export class QualityEventsModule {}
