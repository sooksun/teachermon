import { Module } from '@nestjs/common';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { SanitizePipe } from './pipes/sanitize.pipe';

@Module({
  providers: [HttpExceptionFilter, SanitizePipe],
  exports: [HttpExceptionFilter, SanitizePipe],
})
export class CommonModule {}
