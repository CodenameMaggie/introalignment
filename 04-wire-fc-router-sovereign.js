#!/usr/bin/env node
/**
 * BUILD 2: WIRE FC-ROUTER → askSovereign
 * ========================================
 * 
 * This patches fc-router.js so all C-Suite bots use askSovereign()
 * which routes to the fine-tuned model on the A4000 GPU.
 * 
 * Before: bots use generic llm.ask() → xAI Grok (no business context)
 * After:  bots use askSovereign() → fine-tuned qwen3 on GPU (full knowledge)
 * 
 * Fallback chain preserved: GPU → xAI Grok → Groq → Gemini → Template
 * 
 * RUN ON: Forbes Command (5.78.139.9)
 * PASTE: cat > /root/mfs/patches/wire-sovereign-router.js << 'EOF' ... EOF
 *        cd /root/mfs && node patches/wire-sovereign-router.js
 */

const fs = require('fs');
const path = require('path');

const FC_ROUTER = '/root/mfs/api/c-suite/fc-router.js';
const SOVEREIGN_ENGINE = '/root/mfs/api/sovereign-engine.js';

function main() {
  console.log('═══ WIRING FC-ROUTER → askSovereign ═══\n');

  // Check files exist
  if (!fs.existsSync(FC_ROUTER)) {
    console.log('❌ fc-router.js not found at', FC_ROUTER);
    process.exit(1);
  }

  // Check if sovereign-engine exists
  const hasSovereignEngine = fs.existsSync(SOVEREIGN_ENGINE);
  console.log(`  sovereign-engine.js: ${hasSovereignEngine ? '✅ found' : '⚠ not found — will create'}`);

  // Read current fc-router
  let router = fs.readFileSync(FC_ROUTER, 'utf8');
  
  // Backup
  const backup = FC_ROUTER + '.bak-' + new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  fs.writeFileSync(backup, router);
  console.log(`  Backup: ${backup}`);

  // ─── PATCH 1: Add sovereign-engine import at top ───
  if (!router.includes('sovereign-engine') && !router.includes('askSovereign')) {
    // Find the llm-router require line and add sovereign-engine after it
    const llmRequire = router.match(/const llm\s*=\s*require\([^)]+\);?/);
    if (llmRequire) {
      const insertAfter = llmRequire[0];
      const sovereignImport = `
// Sovereign Engine — fine-tuned model on A4000 GPU
let askSovereign, askSovereignQuick;
try {
  const sovereign = require('../sovereign-engine');
  askSovereign = sovereign.askSovereign;
  askSovereignQuick = sovereign.askSovereignQuick;
  console.log('✅ Sovereign Engine loaded — C-Suite talks through fine-tuned GPU model');
} catch (e) {
  console.warn('⚠ Sovereign Engine not available — falling back to llm.ask():', e.message);
  askSovereign = null;
  askSovereignQuick = null;
}`;
      router = router.replace(insertAfter, insertAfter + '\n' + sovereignImport);
      console.log('  ✅ Patch 1: sovereign-engine import added');
    } else {
      console.log('  ⚠ Could not find llm require — adding at top');
      router = `// Sovereign Engine — fine-tuned model on A4000 GPU
let askSovereign, askSovereignQuick;
try {
  const sovereign = require('../sovereign-engine');
  askSovereign = sovereign.askSovereign;
  askSovereignQuick = sovereign.askSovereignQuick;
} catch (e) { askSovereign = null; askSovereignQuick = null; }
` + router;
      console.log('  ✅ Patch 1: sovereign-engine import added at top');
    }
  } else {
    console.log('  ⏭ Patch 1: sovereign-engine already imported');
  }

  // ─── PATCH 2: Replace the generic llm.ask() talk handler with askSovereign ───
  // Look for the section that handles non-GRACE/non-MIRA bots with llm.ask()
  const genericHandler = router.match(/\/\/ All others.*?llm\.ask\(prompt[\s\S]*?}\s*\);/);
  if (genericHandler) {
    const newHandler = `// All others — askSovereign (fine-tuned GPU model) with llm.ask fallback
    var prompt = bot + ', Maggie is asking you: ' + msg;
    var systemPrompt = 'You are ' + bot + ' of The Sovereign Economy. Respond in character. Be concise and direct.';
    var result;
    
    if (askSovereign) {
      try {
        result = await askSovereign(prompt, { bot: bot, business: req.body.business || 'SE' });
      } catch (se) {
        console.warn('[FC TALK ' + bot + '] Sovereign failed, falling back:', se.message);
        result = null;
      }
    }
    
    // Fallback to llm.ask if sovereign unavailable or failed
    if (!result || !result.content) {
      result = await llm.ask(prompt, {
        system: systemPrompt,
        temperature: 0.7,
        maxTokens: 800
      });
    }`;
    
    router = router.replace(genericHandler[0], newHandler);
    console.log('  ✅ Patch 2: Talk handler now uses askSovereign → llm.ask fallback');
  } else {
    console.log('  ⚠ Patch 2: Could not find generic handler pattern — check fc-router manually');
  }

  // ─── PATCH 3: Add /api/sovereign-status endpoint ───
  if (!router.includes('sovereign-status')) {
    const statusEndpoint = `
// Sovereign Engine status
router.get('/sovereign-status', async (req, res) => {
  try {
    const http = require('http');
    const gpuCheck = await new Promise((resolve) => {
      const r = http.request({ hostname: '155.117.43.57', port: 11434, path: '/api/tags', timeout: 5000 }, (resp) => {
        let d = '';
        resp.on('data', c => d += c);
        resp.on('end', () => {
          try { resolve({ online: true, models: JSON.parse(d).models.map(m => m.name) }); }
          catch { resolve({ online: true, models: [] }); }
        });
      });
      r.on('error', () => resolve({ online: false }));
      r.on('timeout', () => { r.destroy(); resolve({ online: false }); });
      r.end();
    });
    res.json({
      engine: 'Sovereign Economy LLM',
      gpu: gpuCheck,
      sovereignAvailable: !!askSovereign,
      fallback: 'llm-router (xAI→Groq→Gemini)',
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.json({ error: e.message });
  }
});
`;
    // Insert before module.exports
    const exportLine = router.lastIndexOf('module.exports');
    if (exportLine > -1) {
      router = router.substring(0, exportLine) + statusEndpoint + '\n' + router.substring(exportLine);
      console.log('  ✅ Patch 3: /api/sovereign-status endpoint added');
    }
  } else {
    console.log('  ⏭ Patch 3: sovereign-status already exists');
  }

  // Write patched file
  fs.writeFileSync(FC_ROUTER, router);
  console.log('\n  ✅ fc-router.js patched and saved');
  console.log('  Restart: cd /root/mfs && pm2 restart mfs');
  console.log('  Test: curl http://localhost:3000/api/talk/dave -X POST -H "Content-Type: application/json" -d \'{"message":"Revenue status?"}\'');
  console.log('  Status: curl http://localhost:3000/api/sovereign-status');
}

main();
