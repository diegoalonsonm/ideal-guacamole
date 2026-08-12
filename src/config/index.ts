export {
  projectConfigSchema,
  deployTargetSchema,
  stackSchema,
  thresholdsSchema,
  pathsSchema,
  type ProjectConfig,
  type DeployTarget,
  type Stack,
  type Thresholds,
  type ProjectPaths,
} from './schema.js';

export { loadConfig, loadConfigOrThrow, parseConfig, ConfigValidationError } from './loader.js';
