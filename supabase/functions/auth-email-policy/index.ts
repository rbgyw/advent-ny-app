import { createAuthEmailPolicyHandler } from './handler.ts';

Deno.serve(createAuthEmailPolicyHandler(name => Deno.env.get(name)));
