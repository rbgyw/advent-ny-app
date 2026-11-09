import { createHandler } from './handler.ts';

Deno.serve(createHandler((name: string) => Deno.env.get(name)));
