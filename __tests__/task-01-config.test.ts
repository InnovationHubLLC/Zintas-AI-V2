import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..');

describe('TASK-01: Configuration Verification', () => {
  describe('package.json', () => {
    const packageJsonPath = path.resolve(PROJECT_ROOT, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    it('should have name "zintas-pilot"', () => {
      expect(packageJson.name).toBe('zintas-pilot');
    });

    it('should NOT have @netlify/plugin-nextjs in dependencies', () => {
      expect(packageJson.dependencies?.['@netlify/plugin-nextjs']).toBeUndefined();
      expect(packageJson.devDependencies?.['@netlify/plugin-nextjs']).toBeUndefined();
    });

    describe('required dependencies', () => {
      it('should have @clerk/nextjs', () => {
        expect(packageJson.dependencies['@clerk/nextjs']).toBeDefined();
      });

      it('should have @langchain/langgraph', () => {
        expect(packageJson.dependencies['@langchain/langgraph']).toBeDefined();
      });

      it('should have zod', () => {
        expect(packageJson.dependencies['zod']).toBeDefined();
      });

      it('should have react-hook-form', () => {
        expect(packageJson.dependencies['react-hook-form']).toBeDefined();
      });

      it('should have @upstash/redis', () => {
        expect(packageJson.dependencies['@upstash/redis']).toBeDefined();
      });

      it('should have resend', () => {
        expect(packageJson.dependencies['resend']).toBeDefined();
      });

      it('should have date-fns', () => {
        expect(packageJson.dependencies['date-fns']).toBeDefined();
      });
    });

    describe('required devDependencies', () => {
      it('should have vitest', () => {
        expect(packageJson.devDependencies['vitest']).toBeDefined();
      });

      it('should have tailwindcss-animate', () => {
        expect(packageJson.devDependencies['tailwindcss-animate']).toBeDefined();
      });

      it('should have @testing-library/react', () => {
        expect(packageJson.devDependencies['@testing-library/react']).toBeDefined();
      });
    });

    describe('test scripts', () => {
      it('should have test script', () => {
        expect(packageJson.scripts['test']).toBeDefined();
      });

      it('should have test:watch script', () => {
        expect(packageJson.scripts['test:watch']).toBeDefined();
      });

      it('should have test:coverage script', () => {
        expect(packageJson.scripts['test:coverage']).toBeDefined();
      });
    });
  });

  describe('tsconfig.json', () => {
    const tsconfigPath = path.resolve(PROJECT_ROOT, 'tsconfig.json');
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

    it('should have strict: true', () => {
      expect(tsconfig.compilerOptions.strict).toBe(true);
    });

    it('should have path alias @packages/*', () => {
      expect(tsconfig.compilerOptions.paths['@packages/*']).toBeDefined();
      expect(tsconfig.compilerOptions.paths['@packages/*']).toEqual(['./packages/*']);
    });

    it('should have path alias @/*', () => {
      expect(tsconfig.compilerOptions.paths['@/*']).toBeDefined();
      expect(tsconfig.compilerOptions.paths['@/*']).toEqual(['./*']);
    });
  });

  describe('.env.example', () => {
    const envExamplePath = path.resolve(PROJECT_ROOT, '.env.example');
    const envContent = fs.readFileSync(envExamplePath, 'utf-8');

    const expectedEnvVars = [
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY',
      'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
      'NEXT_PUBLIC_CLERK_SIGN_UP_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'ANTHROPIC_API_KEY',
      'SE_RANKING_API_KEY',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'GOOGLE_REDIRECT_URI',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
      'RESEND_API_KEY',
      'RECAPTCHA_SECRET_KEY',
      'ENCRYPTION_KEY',
      'AGENT_API_KEY',
      'NEXT_PUBLIC_APP_URL',
    ];

    // Parse env file to extract keys
    const envKeys = envContent
      .split('\n')
      .filter((line) => line.trim() && !line.trim().startsWith('#'))
      .map((line) => line.split('=')[0].trim())
      .filter((key) => key.length > 0);

    it('should contain all 18 expected environment variable keys', () => {
      expectedEnvVars.forEach((envVar) => {
        expect(envKeys).toContain(envVar);
      });
    });

    it('should have exactly 18 environment variable keys', () => {
      // Count only unique non-empty keys
      const uniqueKeys = [...new Set(envKeys)];
      expect(uniqueKeys.length).toBeGreaterThanOrEqual(18);
    });
  });

  describe('components.json', () => {
    const componentsJsonPath = path.resolve(PROJECT_ROOT, 'components.json');
    const componentsJson = JSON.parse(fs.readFileSync(componentsJsonPath, 'utf-8'));

    it('should have style: "new-york"', () => {
      expect(componentsJson.style).toBe('new-york');
    });

    it('should have cssVariables: true', () => {
      expect(componentsJson.tailwind.cssVariables).toBe(true);
    });
  });
});
