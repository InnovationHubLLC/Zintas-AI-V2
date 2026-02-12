import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..');

describe('TASK-01: Project Structure Verification', () => {
  describe('Package directories and files', () => {
    it('should have packages/db/index.ts', () => {
      const filePath = path.resolve(PROJECT_ROOT, 'packages/db/index.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have packages/agents/conductor/index.ts', () => {
      const filePath = path.resolve(PROJECT_ROOT, 'packages/agents/conductor/index.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have packages/agents/scholar/index.ts', () => {
      const filePath = path.resolve(PROJECT_ROOT, 'packages/agents/scholar/index.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have packages/agents/ghostwriter/index.ts', () => {
      const filePath = path.resolve(PROJECT_ROOT, 'packages/agents/ghostwriter/index.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have packages/agents/analyst/index.ts', () => {
      const filePath = path.resolve(PROJECT_ROOT, 'packages/agents/analyst/index.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have packages/compliance/index.ts', () => {
      const filePath = path.resolve(PROJECT_ROOT, 'packages/compliance/index.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have packages/plain-english/index.ts', () => {
      const filePath = path.resolve(PROJECT_ROOT, 'packages/plain-english/index.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have packages/local-seo/index.ts', () => {
      const filePath = path.resolve(PROJECT_ROOT, 'packages/local-seo/index.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have packages/audit-engine/index.ts', () => {
      const filePath = path.resolve(PROJECT_ROOT, 'packages/audit-engine/index.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('Infrastructure directories', () => {
    it('should have supabase/migrations directory', () => {
      const dirPath = path.resolve(PROJECT_ROOT, 'supabase/migrations');
      expect(fs.existsSync(dirPath)).toBe(true);
    });

    it('should have infrastructure directory', () => {
      const dirPath = path.resolve(PROJECT_ROOT, 'infrastructure');
      expect(fs.existsSync(dirPath)).toBe(true);
    });
  });

  describe('Configuration files', () => {
    it('should NOT have netlify.toml', () => {
      const filePath = path.resolve(PROJECT_ROOT, 'netlify.toml');
      expect(fs.existsSync(filePath)).toBe(false);
    });

    it('should have .env.example', () => {
      const filePath = path.resolve(PROJECT_ROOT, '.env.example');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have components.json', () => {
      const filePath = path.resolve(PROJECT_ROOT, 'components.json');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have lib/utils.ts', () => {
      const filePath = path.resolve(PROJECT_ROOT, 'lib/utils.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have vitest.config.ts', () => {
      const filePath = path.resolve(PROJECT_ROOT, 'vitest.config.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have CLAUDE.md', () => {
      const filePath = path.resolve(PROJECT_ROOT, 'CLAUDE.md');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});
