#!/usr/bin/env node
/**
 * run-pipeline.mjs -- Orchestrator: chains all pipeline steps
 *
 * Coordinates the full demo video pipeline from Playwright spec to final MP4:
 *   1. Extract captions from spec file -> JSON manifest
 *   2. Generate per-caption TTS audio via ElevenLabs (cached)
 *   3. Merge video + audio with freeze-frame algorithm
 *   4. Add background music overlay
 *
 * Zero npm dependencies -- uses Node.js builtins only.
 *
 * Usage:
 *   node run-pipeline.mjs --spec <spec.ts> --video <video.webm> [options]
 *
 * Options:
 *   --spec, -s <path>        Playwright spec file with caption calls
 *   --video, -v <path>       Recorded video file (webm or mp4)
 *   --music <path>           Background music track (optional)
 *   --output-dir, -d <dir>   Working directory for intermediate files (default: ./demo-output)
 *   --output, -o <path>      Final output video path (default: <output-dir>/demo-final.mp4)
 *   --voice-id <id>          ElevenLabs voice ID (default: Matilda)
 *   --model <id>             ElevenLabs model (default: eleven_turbo_v2_5)
 *   --show-fn <name>         Custom showCaption function name
 *   --caption-fn <name>      Custom caption function name
 *   --hide-fn <name>         Custom hideCaption function name
 *   --music-volume <0-1>     Background music volume (default: 0.15)
 *   --skip-voice             Skip TTS generation (use existing audio files)
 *   --skip-music             Skip music overlay step
 *   --dry-run                Print commands without executing
 *   --api-key <key>          ElevenLabs API key (overrides env var)
 *   --env-file <path>        Path to .env file
 *
 * Environment:
 *   ELEVENLABS_API_KEY       API key for TTS generation
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: node run-pipeline.mjs --spec <spec.ts> --video <video.webm> [options]

Options:
  --spec, -s <path>        Playwright spec file with caption calls
  --video, -v <path>       Recorded video file (webm or mp4)
  --music <path>           Background music track (optional)
  --output-dir, -d <dir>   Working directory (default: ./demo-output)
  --output, -o <path>      Final output path (default: <dir>/demo-final.mp4)
  --voice-id <id>          ElevenLabs voice ID (default: Matilda)
  --model <id>             ElevenLabs model (default: eleven_turbo_v2_5)
  --show-fn <name>         Custom showCaption function name
  --caption-fn <name>      Custom caption function name
  --hide-fn <name>         Custom hideCaption function name
  --music-volume <0-1>     Music volume (default: 0.15)
  --skip-voice             Skip TTS, use existing audio
  --skip-music             Skip music overlay
  --dry-run                Print plan without executing
  --api-key <key>          ElevenLabs API key
  --env-file <path>        Path to .env file`);
  process.exit(0);
}

function getArg(flags, defaultVal) {
  const flagList = Array.isArray(flags) ? flags : [flags];
  for (const flag of flagList) {
    const idx = args.indexOf(flag);
    if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  }
  return defaultVal;
}

function hasFlag(flag) {
  return args.includes(flag);
}

const specFile = getArg(['--spec', '-s'], null);
const videoFile = getArg(['--video', '-v'], null);
const musicFile = getArg(['--music'], null);
const outputDir = getArg(['--output-dir', '-d'], './demo-output');
const voiceId = getArg(['--voice-id'], null);
const modelId = getArg(['--model'], null);
const showFn = getArg(['--show-fn'], null);
const captionFn = getArg(['--caption-fn'], null);
const hideFn = getArg(['--hide-fn'], null);
const musicVolume = getArg(['--music-volume'], null);
const apiKey = getArg(['--api-key'], null);
const envFile = getArg(['--env-file'], null);
const skipVoice = hasFlag('--skip-voice');
const skipMusic = hasFlag('--skip-music');
const dryRun = hasFlag('--dry-run');

// Computed paths
const manifestPath = path.join(outputDir, 'captions.json');
const audioDir = path.join(outputDir, 'audio');
const voicedVideo = path.join(outputDir, 'demo-with-voice.mp4');
const finalOutput = getArg(['--output', '-o'], path.join(outputDir, 'demo-final.mp4'));

// ---------------------------------------------------------------------------
// Pre-flight checks
// ---------------------------------------------------------------------------

function preflight() {
  console.log('=== Demo Video Pipeline ===\n');
  console.log('Pre-flight checks...');

  const errors = [];

  // Required inputs
  if (!specFile) errors.push('--spec is required: path to Playwright spec file');
  else if (!fs.existsSync(specFile)) errors.push(`Spec file not found: ${specFile}`);

  if (!videoFile) errors.push('--video is required: path to recorded video file');
  else if (!fs.existsSync(videoFile)) errors.push(`Video file not found: ${videoFile}`);

  if (musicFile && !fs.existsSync(musicFile)) {
    errors.push(`Music file not found: ${musicFile}`);
  }

  // ffmpeg/ffprobe
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
    console.log('  [OK] ffmpeg');
  } catch {
    errors.push('ffmpeg not found. Install: brew install ffmpeg');
  }

  try {
    execSync('ffprobe -version', { stdio: 'pipe' });
    console.log('  [OK] ffprobe');
  } catch {
    errors.push('ffprobe not found. Install: brew install ffmpeg');
  }

  // Node.js version (need 18+ for native fetch)
  const nodeVersion = parseInt(process.version.slice(1), 10);
  if (nodeVersion < 18) {
    errors.push(`Node.js 18+ required for native fetch (found ${process.version})`);
  } else {
    console.log(`  [OK] Node.js ${process.version}`);
  }

  // ElevenLabs API key (only if not skipping voice)
  if (!skipVoice) {
    const key = apiKey ||
      process.env.ELEVENLABS_API_KEY ||
      process.env.ELEVAN_LABS_API_KEY ||
      loadKeyFromEnvFile();
    if (!key) {
      errors.push('ElevenLabs API key not found. Set ELEVENLABS_API_KEY or use --api-key');
    } else {
      console.log('  [OK] ElevenLabs API key');
    }
  }

  if (errors.length > 0) {
    console.error('\nPre-flight FAILED:');
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log('\nAll checks passed.\n');
}

function loadKeyFromEnvFile() {
  const envPath = envFile ? path.resolve(envFile) : path.resolve('.env');
  if (!fs.existsSync(envPath)) return null;
  const content = fs.readFileSync(envPath, 'utf-8');
  const match =
    content.match(/ELEVENLABS_API_KEY=(.+)/) ||
    content.match(/ELEVAN_LABS_API_KEY=(.+)/);
  return match ? match[1].trim().replace(/^["']|["']$/g, '') : null;
}

// ---------------------------------------------------------------------------
// Pipeline step execution
// ---------------------------------------------------------------------------

function runScript(scriptName, scriptArgs) {
  const scriptPath = path.join(__dirname, scriptName);
  const cmd = `node "${scriptPath}" ${scriptArgs.join(' ')}`;

  if (dryRun) {
    console.log(`  [DRY RUN] ${cmd}\n`);
    return;
  }

  console.log(`  Running: ${cmd}\n`);
  execSync(cmd, { stdio: 'inherit' });
  console.log();
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

function main() {
  preflight();

  // Create output directory
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(audioDir, { recursive: true });

  const startTime = Date.now();

  // --- Step 1: Extract captions ---
  console.log('========================================');
  console.log('STEP 1/4: Extract Captions');
  console.log('========================================\n');

  const extractArgs = [
    `"${specFile}"`,
    `--output "${manifestPath}"`,
  ];
  if (showFn) extractArgs.push(`--show-fn ${showFn}`);
  if (captionFn) extractArgs.push(`--caption-fn ${captionFn}`);
  if (hideFn) extractArgs.push(`--hide-fn ${hideFn}`);

  runScript('extract-captions.mjs', extractArgs);

  // Verify manifest was created
  if (!dryRun && (!fs.existsSync(manifestPath) || fs.statSync(manifestPath).size === 0)) {
    console.error('Error: Caption manifest was not created. Check spec file for caption calls.');
    process.exit(1);
  }

  // --- Step 2: Generate voice ---
  console.log('========================================');
  console.log('STEP 2/4: Generate Voice (ElevenLabs)');
  console.log('========================================\n');

  if (skipVoice) {
    console.log('  [SKIPPED] --skip-voice flag set. Using existing audio files.\n');
  } else {
    const voiceArgs = [
      `"${manifestPath}"`,
      `--output-dir "${audioDir}"`,
    ];
    if (voiceId) voiceArgs.push(`--voice-id ${voiceId}`);
    if (modelId) voiceArgs.push(`--model ${modelId}`);
    if (apiKey) voiceArgs.push(`--api-key ${apiKey}`);
    if (envFile) voiceArgs.push(`--env-file "${envFile}"`);

    runScript('generate-voice.mjs', voiceArgs);
  }

  // --- Step 3: Merge video ---
  console.log('========================================');
  console.log('STEP 3/4: Merge Video (Freeze-Frame)');
  console.log('========================================\n');

  const mergeOutput = (musicFile && !skipMusic) ? voicedVideo : finalOutput;
  const mergeArgs = [
    `--video "${videoFile}"`,
    `--manifest "${manifestPath}"`,
    `--audio-dir "${audioDir}"`,
    `--output "${mergeOutput}"`,
  ];

  runScript('merge-video.mjs', mergeArgs);

  // --- Step 4: Add music ---
  console.log('========================================');
  console.log('STEP 4/4: Add Background Music');
  console.log('========================================\n');

  if (!musicFile || skipMusic) {
    const reason = skipMusic ? '--skip-music flag set' : 'no --music provided';
    console.log(`  [SKIPPED] ${reason}. Voiced video is the final output.\n`);
  } else {
    const musicArgs = [
      `--video "${voicedVideo}"`,
      `--music "${musicFile}"`,
      `--output "${finalOutput}"`,
    ];
    if (musicVolume) musicArgs.push(`--volume ${musicVolume}`);

    runScript('add-music.mjs', musicArgs);

    // Clean up intermediate voiced video if music was added
    if (!dryRun && fs.existsSync(voicedVideo) && finalOutput !== voicedVideo) {
      // Keep it -- user might want to compare
      console.log(`  Intermediate file kept: ${voicedVideo}\n`);
    }
  }

  // --- Summary ---
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('========================================');
  console.log('PIPELINE COMPLETE');
  console.log('========================================\n');

  if (!dryRun) {
    const effectiveOutput = (musicFile && !skipMusic) ? finalOutput : mergeOutput;
    if (fs.existsSync(effectiveOutput)) {
      const stats = fs.statSync(effectiveOutput);
      console.log(`Output:   ${path.resolve(effectiveOutput)}`);
      console.log(`Size:     ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
    }
  }

  console.log(`Elapsed:  ${elapsed}s`);
  console.log(`\nFiles in ${path.resolve(outputDir)}:`);

  if (!dryRun) {
    const files = fs.readdirSync(outputDir);
    for (const f of files) {
      const fp = path.join(outputDir, f);
      const stat = fs.statSync(fp);
      if (stat.isDirectory()) {
        const subfiles = fs.readdirSync(fp);
        console.log(`  ${f}/ (${subfiles.length} files)`);
      } else {
        console.log(`  ${f} (${(stat.size / 1024).toFixed(0)} KB)`);
      }
    }
  }
}

main();
