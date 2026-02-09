import { Injectable, Logger } from '@nestjs/common';
import { CompletenessService, DeckCompleteness } from './completeness.service';
import { getSlidesForRound, INDICATOR_CHECK_CONFIG } from '@teachermon/shared';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class DeckGeneratorService {
  private readonly logger = new Logger(DeckGeneratorService.name);
  private readonly dataRoot: string;

  constructor(private readonly completenessService: CompletenessService) {
    this.dataRoot = process.env.ANALYSIS_DATA_ROOT || '/data/jobs';
  }

  /**
   * สร้าง Slidev deck สำหรับครูผู้ช่วย
   */
  async generateDeck(
    teacherId: string,
    assessmentRound: number,
    academicYear: string = '2568',
  ): Promise<{ deckPath: string; completeness: DeckCompleteness }> {
    // 1. คำนวณ completeness
    const completeness = await this.completenessService.calculateCompleteness(
      teacherId,
      assessmentRound,
    );

    // 2. สร้าง directory
    const deckDir = path.join(this.dataRoot, 'decks', teacherId, academicYear);
    await fs.mkdir(path.join(deckDir, 'data'), { recursive: true });
    await fs.mkdir(path.join(deckDir, 'components'), { recursive: true });

    // 3. เขียน data files
    await fs.writeFile(
      path.join(deckDir, 'data', 'completeness.json'),
      JSON.stringify(completeness, null, 2),
      'utf8',
    );

    await fs.writeFile(
      path.join(deckDir, 'data', 'indicators.json'),
      JSON.stringify(INDICATOR_CHECK_CONFIG, null, 2),
      'utf8',
    );

    // 4. สร้าง slides.md
    const slidesContent = this.buildSlidesMarkdown(completeness, assessmentRound, academicYear);
    await fs.writeFile(path.join(deckDir, 'slides.md'), slidesContent, 'utf8');

    // 5. สร้าง components
    await this.writeComponents(deckDir);

    this.logger.log(`Deck generated for teacher ${teacherId}, round ${assessmentRound} at ${deckDir}`);

    return { deckPath: deckDir, completeness };
  }

  /**
   * สร้าง Slidev markdown
   */
  private buildSlidesMarkdown(
    c: DeckCompleteness,
    round: number,
    academicYear: string,
  ): string {
    const slides: string[] = [];

    // ─── Slide 1: Cover ───
    slides.push(`---
theme: default
title: "สรุปการเตรียมความพร้อมและพัฒนาอย่างเข้ม (ว19/2568)"
info: false
download: true
---

# สรุปผลการเตรียมความพร้อม
## ว19/2568 ครั้งที่ ${round}

**${c.teacherName}**

ปีการศึกษา ${academicYear}

<div class="text-sm opacity-60 mt-4">อัปเดตล่าสุด: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
`);

    // ─── Slide 2: Overview ───
    const domains = c.domains;
    const proScore = domains.PROFESSIONAL?.score || 0;
    const socScore = domains.SOCIAL?.score || '-';
    const perScore = domains.PERSONAL?.score || 0;

    slides.push(`---
layout: two-cols
---

## ภาพรวมความสมบูรณ์

### ความสมบูรณ์รวม: **${c.deck.score}%** (${this.getStatusLabel(c.deck.status)})

| ด้าน | คะแนน | สถานะ |
|------|--------|-------|
| ด้านวิชาชีพ | ${proScore}% | ${domains.PROFESSIONAL ? this.getStatusEmoji(domains.PROFESSIONAL.status) : '-'} |
| ด้านสังคม | ${socScore}${typeof socScore === 'number' ? '%' : ''} | ${domains.SOCIAL ? this.getStatusEmoji(domains.SOCIAL.status) : 'ยังไม่ใช้'} |
| ด้านคุณลักษณะ | ${perScore}% | ${domains.PERSONAL ? this.getStatusEmoji(domains.PERSONAL.status) : '-'} |

::right::

### เกณฑ์ผ่าน (ครั้งที่ ${round})

${c.passCriteria.professional.passed ? '✅' : '❌'} วิชาชีพ: ${c.passCriteria.professional.actual}/${c.passCriteria.professional.required}

${c.passCriteria.social ? `${c.passCriteria.social.passed ? '✅' : '❌'} สังคม: ${c.passCriteria.social.actual}/${c.passCriteria.social.required}` : '➖ สังคม: ไม่ใช้ในครั้งนี้'}

${c.passCriteria.personal.passed ? '✅' : '❌'} คุณลักษณะ: ${c.passCriteria.personal.actual}/${c.passCriteria.personal.required}

---

**ผลรวม: ${c.passCriteria.overall ? '✅ ผ่านเกณฑ์' : '❌ ยังไม่ผ่านเกณฑ์'}**
`);

    // ─── Slide 3: Professional Overview ───
    const proItems = Object.entries(c.items)
      .filter(([id]) => id.startsWith('PRO_'))
      .sort(([a], [b]) => a.localeCompare(b));

    slides.push(`---

## ด้านวิชาชีพ (${proScore}%)

| # | ตัวชี้วัด | คะแนน | สถานะ |
|---|----------|--------|-------|
${proItems.map(([id, item], i) => `| ${i + 1} | ${item.name} | ${item.score}% | ${this.getStatusEmoji(item.status)} |`).join('\n')}
`);

    // ─── Slides 4-9: Professional Details ───
    for (const [id, item] of proItems) {
      const checksList = (item.checks || [])
        .map((ch: any) => `- ${ch.passed ? '✅' : '⬜'} ${ch.label} (${ch.weight}%)`)
        .join('\n');

      const missingList = (item.missing || []).length > 0
        ? `\n### สิ่งที่ยังขาด\n${item.missing.map((m: string) => `- ❗ ${m}`).join('\n')}`
        : '\n### ✅ ครบทุกรายการ';

      slides.push(`---

## ${item.name} (${item.score}%)

### Checklist หลักฐาน
${checksList}
${missingList}
`);
    }

    // ─── Social (if round 3-4) ───
    if (round >= 3 && domains.SOCIAL) {
      const socItems = Object.entries(c.items)
        .filter(([id]) => id.startsWith('SOC_'));

      slides.push(`---

## ด้านสังคม (${domains.SOCIAL.score}%)

${socItems.map(([id, item]) => {
  const checksList = (item.checks || [])
    .map((ch: any) => `- ${ch.passed ? '✅' : '⬜'} ${ch.label}`)
    .join('\n');
  return `### ${item.name} (${item.score}%)\n${checksList}`;
}).join('\n\n')}
`);
    }

    // ─── Personal: Discipline ───
    const perDiscipline = Object.entries(c.items)
      .filter(([id]) => id.startsWith('PER_1'));

    slides.push(`---

## วินัย คุณธรรม จริยธรรม

${perDiscipline.map(([id, item]) => `- ${item.score >= 60 ? '✅' : '⬜'} ${item.name} (${item.score}%)`).join('\n')}
`);

    // ─── Personal: Development (if round 3-4) ───
    if (round >= 3) {
      const perDev = Object.entries(c.items)
        .filter(([id]) => id.startsWith('PER_2'));

      slides.push(`---

## การพัฒนาตนเอง

${perDev.map(([id, item]) => {
  const checksList = (item.checks || [])
    .map((ch: any) => `  - ${ch.passed ? '✅' : '⬜'} ${ch.label}`)
    .join('\n');
  return `### ${item.name} (${item.score}%)\n${checksList}`;
}).join('\n\n')}
`);
    }

    // ─── Summary Slide ───
    const allMissing = Object.entries(c.items)
      .filter(([, item]) => (item.missing || []).length > 0)
      .map(([id, item]) => `- **${item.name}**: ${item.missing.slice(0, 2).join(', ')}`)
      .slice(0, 8);

    slides.push(`---
layout: end
---

# สรุปสิ่งที่ต้องเติม

${allMissing.length > 0 ? allMissing.join('\n') : '✅ ไม่มีรายการที่ขาด - พร้อมนำเสนอ!'}

${c.deck.score >= 80
  ? '### 🎉 ความสมบูรณ์ ≥ 80% — พร้อมนำเสนอ!'
  : `### ⚠️ ความสมบูรณ์ ${c.deck.score}% — กรุณาเติมหลักฐานให้ครบ`}
`);

    return slides.join('\n');
  }

  private getStatusLabel(status: string): string {
    switch (status) {
      case 'READY': return 'พร้อมนำเสนอ';
      case 'DRAFT': return 'ฉบับร่าง';
      default: return 'ยังไม่เพียงพอ';
    }
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'READY': return '🟢';
      case 'DRAFT': return '🟡';
      default: return '🔴';
    }
  }

  /**
   * เขียน Vue components สำหรับ Slidev
   */
  private async writeComponents(deckDir: string): Promise<void> {
    // ProgressBar.vue
    const progressBar = `<template>
  <div class="my-3">
    <div class="flex justify-between text-sm">
      <span class="opacity-80">{{ label }}</span>
      <span class="font-semibold">{{ value }}%</span>
    </div>
    <div class="h-3 bg-gray-200 rounded mt-1 overflow-hidden">
      <div
        class="h-3 rounded transition-all duration-500"
        :style="{ width: value + '%', background: color }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ value: number; label: string }>()
const color =
  props.value >= 80 ? '#22c55e' : props.value >= 50 ? '#f59e0b' : '#ef4444'
</script>`;

    await fs.writeFile(
      path.join(deckDir, 'components', 'ProgressBar.vue'),
      progressBar,
      'utf8',
    );
  }
}
