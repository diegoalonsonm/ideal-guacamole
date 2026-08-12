import { z } from 'zod';

export const deployTargetSchema = z.enum(['vercel', 'fly', 'aws', 'gcp', 'azure', 'custom']);
export type DeployTarget = z.infer<typeof deployTargetSchema>;

export const stackSchema = z.object({
  frontend: z.string().optional(),
  backend: z.string().optional(),
  database: z.string().optional(),
  infrastructure: z.string().optional(),
});
export type Stack = z.infer<typeof stackSchema>;

export const thresholdsSchema = z.object({
  passCritical: z.number().min(0).max(1).default(1),
  passTotal: z.number().min(0).max(1).default(0.95),
  maxIter: z.number().int().min(1).max(10).default(3),
  coverageLines: z.number().min(0).max(1).default(0.8),
  coverageFunctions: z.number().min(0).max(1).default(0.8),
});
export type Thresholds = z.infer<typeof thresholdsSchema>;

export const pathsSchema = z.object({
  frontend: z.string().default('./web'),
  backend: z.string().default('./api'),
  tests: z.string().default('./tests'),
  docs: z.string().default('./documentacion'),
});
export type ProjectPaths = z.infer<typeof pathsSchema>;

const agentsSchema = z.object({
  enabled: z.array(z.string()).optional(),
  githubProject: z.number().int().positive().optional(),
});

export const projectConfigSchema = z.object({
  name: z.string().min(1).max(214),
  description: z.string().optional(),
  stack: stackSchema.default({}),
  deployTarget: deployTargetSchema.default('custom'),
  thresholds: thresholdsSchema.default({
    passCritical: 1,
    passTotal: 0.95,
    maxIter: 3,
    coverageLines: 0.8,
    coverageFunctions: 0.8,
  }),
  paths: pathsSchema.default({
    frontend: './web',
    backend: './api',
    tests: './tests',
    docs: './documentacion',
  }),
  agents: agentsSchema.default({}),
});
export type ProjectConfig = z.infer<typeof projectConfigSchema>;
