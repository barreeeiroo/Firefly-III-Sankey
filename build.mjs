#!/usr/bin/env node
import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json to get dependencies
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'));
const dependencies = Object.keys(pkg.dependencies || {});

async function build() {
  try {
    console.log('🔨 Building with esbuild...\n');

    // Build CLI (bundle dependencies for faster npx)
    const cliBuild = await esbuild.build({
      entryPoints: [join(__dirname, 'src/cli.ts')],
      bundle: true,
      minify: true,
      platform: 'node',
      target: 'node20',
      outfile: join(__dirname, 'dist/cli.js'),
      format: 'cjs',
      banner: {
        js: '#!/usr/bin/env node',
      },
      external: [], // Bundle everything for smaller/faster npx
      treeShaking: true,
      sourcemap: false,
      metafile: true,
      legalComments: 'none',
    });

    // Build library entry point (keep dependencies external)
    const libBuild = await esbuild.build({
      entryPoints: [join(__dirname, 'src/index.ts')],
      bundle: true,
      minify: true,
      platform: 'node',
      target: 'node20',
      outfile: join(__dirname, 'dist/index.js'),
      format: 'cjs',
      external: dependencies, // Keep dependencies external for library usage
      treeShaking: true,
      sourcemap: false,
      metafile: true,
      legalComments: 'none',
    });

    // Display bundle sizes
    const cliSize = (cliBuild.metafile.outputs['dist/cli.js'].bytes / 1024).toFixed(2);
    const libSize = (libBuild.metafile.outputs['dist/index.js'].bytes / 1024).toFixed(2);

    console.log('✅ Build complete!\n');
    console.log('📦 Output:');
    console.log(`   • dist/cli.js (CLI entry point) - ${cliSize} KB`);
    console.log(`   • dist/index.js (Library entry point) - ${libSize} KB\n`);

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
