import { Module } from '@nestjs/common';
import { PLCService } from './plc.service';
import { PLCController } from './plc.controller';

@Module({
  controllers: [PLCController],
  providers: [PLCService],
  exports: [PLCService],
})
export class PLCModule {}
