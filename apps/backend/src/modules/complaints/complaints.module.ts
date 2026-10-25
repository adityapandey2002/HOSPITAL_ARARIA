import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';
import { ComplaintsController } from './complaints.controller';
import { ComplaintsService } from './complaints.service';

@Module({
  // ComplaintsService injects NotificationsService. Without this import Nest
  // throws UnknownDependenciesException at boot, which takes down every route
  // in the application, not just complaints.
  imports: [NotificationsModule],
  controllers: [ComplaintsController],
  providers: [ComplaintsService],
  exports: [ComplaintsService],
})
export class ComplaintsModule {}
