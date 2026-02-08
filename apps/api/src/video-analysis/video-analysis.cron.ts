import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VideoAnalysisService } from './video-analysis.service';

@Injectable()
export class VideoAnalysisCron {
  private readonly logger = new Logger(VideoAnalysisCron.name);

  constructor(private readonly service: VideoAnalysisService) {}

  /**
   * ทุก 1 นาที: ตรวจ jobs ที่ ASR/frames เสร็จแล้ว → เรียก Gemini AI วิเคราะห์
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handlePendingAnalysis() {
    try {
      await this.service.runPendingAnalysis();
    } catch (err) {
      this.logger.error('Pending analysis cron error', err);
    }
  }

  /**
   * ทุกวันตี 2: ลบ frames ที่หมดอายุ (เก็บ 1 ปี)
   * เหลือไว้: report, evaluation, transcript, cover, thumb
   */
  @Cron('0 2 * * *')
  async handleRetentionCleanup() {
    try {
      const result = await this.service.cleanupExpiredFrames();
      if (result.purged > 0) {
        this.logger.log(`Retention cleanup: purged frames for ${result.purged} jobs`);
      }
    } catch (err) {
      this.logger.error('Retention cleanup error', err);
    }
  }
}
