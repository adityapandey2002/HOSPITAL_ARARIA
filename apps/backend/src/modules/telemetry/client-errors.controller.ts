import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { Public } from '../../common/decorators/public.decorator';
import { ClientErrorsService } from './client-errors.service';
import { ClientErrorDto } from './dto/client-error.dto';

@ApiTags('Telemetry')
@Controller('client-errors')
export class ClientErrorsController {
  constructor(private readonly clientErrorsService: ClientErrorsService) {}

  @Post()
  @Public()
  // Browsers retry error reports on navigation; 20/min is generous for a
  // citizen and useless to a flooder.
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Record a client-side error reported by the web app' })
  @ApiResponse({ status: 202, description: 'Report accepted' })
  record(@Body() dto: ClientErrorDto): { received: true } {
    return this.clientErrorsService.record(dto);
  }
}
