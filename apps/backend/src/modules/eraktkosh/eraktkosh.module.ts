import { Module } from '@nestjs/common';
import { EraktkoshController } from './eraktkosh.controller';
import { EraktkoshService } from './eraktkosh.service';

@Module({
  controllers: [EraktkoshController],
  providers: [EraktkoshService],
  exports: [EraktkoshService],
})
export class EraktkoshModule {}
