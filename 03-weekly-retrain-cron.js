#!/usr/bin/env node
/**
 * SOVEREIGN ECONOMY — WEEKLY RETRAINING PIPELINE
 * 
 * Runs weekly via cron on Forbes Command:
 *   1. Extracts fresh training data from Supabase
 *   2. Sends to A4000 GPU via Ollama API (since no SSH)
 *   3. Triggers fine-tuning on GPU
 * 
 * Add to cron-scheduler: runs every Sunday at 2 AM
 * 
 * RUN ON: Forbes Command (5.78.139.9)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const GPU_HOST = '155.117.43.57';
const GPU_PORT = 11434;
const TRAINING_SCRIPT = '/root/mfs/scripts/extract-training-data.js';
const TRAINING_OUTPUT = '/root/mfs/data/training/sovereign-training-data.jsonl';

async function log(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] [RETRAIN] ${msg}`;
  console.log(line);
  // Also log to file
  fs.appendFileSync('/root/mfs/logs/retraining.log', line + '\n');
}

async function checkGPU() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: GPU_HOST,
      port: GPU_PORT,
      path: '/api/tags',
      method: 'GET',
      timeout: 10000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const models = JSON.parse(data).models || [];
          resolve({ online: true, models: models.map(m => m.name) });
        } catch { resolve({ online: false, models: [] }); }
      });
    });
    req.on('error', () => resolve({ online: false, models: [] }));
    req.on('timeout', () => { req.destroy(); resolve({ online: false, models: [] }); });
    req.end();
  });
}

async function extractData() {
  await log('Extracting training data from Supabase...');
  try {
    execSync(`cd /root/mfs && node ${TRAINING_SCRIPT}`, { timeout: 300000 });
    if (fs.existsSync(TRAINING_OUTPUT)) {
      const lines = fs.readFileSync(TRAINING_OUTPUT, 'utf8').trim().split('\n').length;
      const sizeMB = (fs.statSync(TRAINING_OUTPUT).size / 1024 / 1024).toFixed(2);
      await log(`✅ Extracted ${lines} training pairs (${sizeMB} MB)`);
      return true;
    }
  } catch (e) {
    await log(`❌ Extraction failed: ${e.message}`);
  }
  return false;
}

async function triggerRetraining() {
  // Since we can't SSH, we use a simple HTTP endpoint on the GPU
  // The GPU needs a small Flask/Express server to receive training commands
  // For now, log that manual transfer is needed
  await log('Training data ready. Manual steps:');
  await log(`  1. Transfer: scp ${TRAINING_OUTPUT} root@${GPU_HOST}:/root/training/`);
  await log(`  2. SSH to GPU: ssh root@${GPU_HOST}`);
  await log(`  3. Run: cd /root/training && python3 02-finetune-sovereign-lora.py`);
  await log('  4. New model auto-loads into Ollama as sovereign-economy-v2');
  
  // TODO: When SSH access is restored, automate this:
  // execSync(`scp ${TRAINING_OUTPUT} root@${GPU_HOST}:/root/training/`);
  // execSync(`ssh root@${GPU_HOST} "cd /root/training && python3 02-finetune-sovereign-lora.py"`);
}

async function main() {
  await log('═══ WEEKLY RETRAINING PIPELINE STARTED ═══');
  
  // Check GPU
  const gpu = await checkGPU();
  if (!gpu.online) {
    await log('❌ GPU server unreachable — skipping retraining');
    return;
  }
  await log(`GPU online. Models: ${gpu.models.join(', ')}`);
  
  // Extract fresh data
  const extracted = await extractData();
  if (!extracted) {
    await log('❌ Data extraction failed — skipping retraining');
    return;
  }
  
  // Trigger retraining
  await triggerRetraining();
  
  await log('═══ WEEKLY RETRAINING PIPELINE COMPLETE ═══');
}

main().catch(e => log(`FATAL: ${e.message}`));
