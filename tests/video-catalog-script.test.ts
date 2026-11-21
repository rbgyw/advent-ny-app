import { describe, expect, it } from 'vitest';
// @ts-expect-error The standalone publishing script runs in Node without a build step.
import { generateVideoCatalogSql } from '../scripts/generate-video-catalog.mjs';

describe('video catalog publishing SQL', () => {
  it('quotes metadata, uses permanent IDs, and disables removed cards without deleting votes', () => {
    const sql = generateVideoCatalogSql([{ id: 'video-1', title: "Чьё-то видео ' ; drop table tasks; --", videoUrl: 'videos/1.mp4' }]);
    expect(sql).toContain("Чьё-то видео '' ; drop table tasks; --");
    expect(sql).toContain('set is_active = false');
    expect(sql).toContain('on conflict (task_id, video_id) do update');
    expect(sql).not.toMatch(/delete from/i);
    expect(sql).toContain('begin;');
    expect(sql).toContain('commit;');
  });
  it.each([
    {}, [{ id: 'a', title: 'A' }], [{ id: '../bad', title: 'A', videoUrl: '1.mp4' }],
    [{ id: 'a', title: 'A', videoUrl: 'javascript:alert(1)' }],
    [{ id: 'a', title: 'A', videoUrl: '1.mp4' }, { id: 'a', title: 'B', videoUrl: '2.mp4' }],
  ])('rejects an invalid publication before generating SQL: %j', value => {
    expect(() => generateVideoCatalogSql(value)).toThrow();
  });
});
