import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export function generateVideoCatalogSql(items) {
  if (!Array.isArray(items) || items.length > 100) throw new Error('Expected an array of up to 100 videos.');
  const ids = new Set();
  const catalog = items.map((item, index) => {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' ||
      !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(item.id) || ids.has(item.id) ||
      typeof item.title !== 'string' || !item.title.trim() || item.title.trim().length > 200 ||
      typeof item.videoUrl !== 'string' || !item.videoUrl.trim()) throw new Error(`Check video #${index + 1}: unique id, title, videoUrl required.`);
    for (const field of ['videoUrl', 'posterUrl']) {
      if (item[field] === undefined || item[field] === '') continue;
      if (typeof item[field] !== 'string') throw new Error(`Invalid ${field}`);
      const url = new URL(item[field], 'https://catalog.invalid/collections/');
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error(`Invalid ${field}`);
    }
    ids.add(item.id);
    return { video_id: item.id, title: item.title.trim(), sort_order: index };
  });
  const literal = JSON.stringify(catalog).replaceAll("'", "''");
  return `-- Generated from collections/videos.json. Apply after migration 006.\nbegin;\nset local standard_conforming_strings = on;\nlock table public.advent_video_catalog in share row exclusive mode;\ndo $$ begin\n  if not exists (select 1 from public.tasks where slug = 'task-22') then\n    raise exception 'Task task-22 is missing';\n  end if;\nend $$;\nupdate public.advent_video_catalog set is_active = false\nwhere task_id = (select id from public.tasks where slug = 'task-22');\ninsert into public.advent_video_catalog (task_id, video_id, title, sort_order, is_active)\nselect t.id, v.video_id, v.title, v.sort_order, true\nfrom public.tasks t cross join jsonb_to_recordset('${literal}'::jsonb) as v(video_id text, title text, sort_order integer)\nwhere t.slug = 'task-22'\non conflict (task_id, video_id) do update\nset title = excluded.title, sort_order = excluded.sort_order, is_active = true;\ncommit;\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const input = resolve(root, process.argv[2] ?? 'public/collections/videos.json');
  const output = resolve(root, process.argv[3] ?? 'supabase/video-catalog.sql');
  await writeFile(output, generateVideoCatalogSql(JSON.parse(await readFile(input, 'utf8'))));
  console.log(`SQL written to ${output}`);
}
