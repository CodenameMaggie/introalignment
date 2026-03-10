# ═══════════════════════════════════════════════════════════════
# SOVEREIGN ECONOMY — COMPLETE BUILD DEPLOYMENT GUIDE
# ═══════════════════════════════════════════════════════════════
# 4 items, in order. Each has exact paste commands.
# ═══════════════════════════════════════════════════════════════

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ITEM 1: LoRA FINE-TUNING PIPELINE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 
# STEP 1A: Extract training data (Forbes Command)
#   - Pulls all Supabase data into JSONL training format
#   - File: /root/mfs/scripts/extract-training-data.js
#   - Run:  cd /root/mfs && node scripts/extract-training-data.js
#   - Output: /root/mfs/data/training/sovereign-training-data.jsonl
#
# STEP 1B: Get SSH access to A4000 (see Item 4)
#   - Log into DatabaseMart dashboard
#   - Get or reset root password
#
# STEP 1C: Setup A4000 for fine-tuning (GPU server)
#   - File: /root/setup-gpu.sh
#   - Run:  bash /root/setup-gpu.sh
#   - Installs: PyTorch, Unsloth, CUDA, training deps
#
# STEP 1D: Transfer training data (Forbes Command → GPU)
#   - Run:  scp /root/mfs/data/training/sovereign-training-data.jsonl root@155.117.43.57:/root/training/
#
# STEP 1E: Run fine-tuning (GPU server)
#   - File: /root/training/02-finetune-sovereign-lora.py
#   - Run:  cd /root/training && python3 02-finetune-sovereign-lora.py
#   - Time: 30-90 minutes
#   - Result: sovereign-economy-v2 model loaded into Ollama
#
# STEP 1F: Add weekly retrain cron (Forbes Command)
#   - File: /root/mfs/crons/weekly-retrain.js
#   - Add to cron-scheduler: Sunday 2AM
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ITEM 2: WIRE FC-ROUTER → askSovereign
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# STEP 2A: Deploy patch (Forbes Command)
#   - File: /root/mfs/patches/wire-sovereign-router.js
#   - Run:  cd /root/mfs && node patches/wire-sovereign-router.js
#   - Then: pm2 restart mfs
#
# STEP 2B: Test
#   - curl http://localhost:3000/api/sovereign-status
#   - curl -X POST http://localhost:3000/api/talk/dave \
#       -H "Content-Type: application/json" \
#       -d '{"message":"Revenue status?"}'
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ITEM 3: IC MARKETPLACE (Whop model)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# STEP 3A: Create tables in IC Supabase
#   - Get SQL: curl http://localhost:3000/api/ic-marketplace?action=setup-sql
#   - Run in Supabase SQL Editor
#
# STEP 3B: Deploy API (Forbes Command)
#   - File: /root/mfs/api/ic-marketplace.js
#   - Route is auto-registered by MFS Express
#   - Run:  pm2 restart mfs
#
# STEP 3C: Register route in server.js (if not auto)
#   - Add: app.use('/api/ic-marketplace', require('./api/ic-marketplace'));
#
# STEP 3D: Test
#   - curl http://localhost:3000/api/ic-marketplace?action=status
#   - curl http://localhost:3000/api/ic-marketplace?action=categories
#   - curl http://localhost:3000/api/ic-marketplace?action=stats
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ITEM 4: SSH ACCESS TO A4000
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# STEP 4A: Get credentials
#   - Option 1: DatabaseMart dashboard → Server Details → Root Password
#   - Option 2: Submit support ticket for password reset
#   - Option 3: Use VNC/Console if available in dashboard
#
# STEP 4B: Setup SSH key (once you have password)
#   From Forbes Command:
#   ssh-keygen -t ed25519 -f /root/.ssh/gpu_key -N ""
#   ssh-copy-id -i /root/.ssh/gpu_key root@155.117.43.57
#
# STEP 4C: Add SSH config
#   cat >> /root/.ssh/config << 'SSHEOF'
#   Host gpu
#     HostName 155.117.43.57
#     User root
#     IdentityFile /root/.ssh/gpu_key
#   SSHEOF
#
# Now: ssh gpu

# ═══════════════════════════════════════════════════════════════
# DEPENDENCY ORDER:
#   Item 4 (SSH) → Item 1 (Fine-tune) → Item 2 (Wire router)
#   Item 3 (Marketplace) can run in parallel — no GPU needed
# ═══════════════════════════════════════════════════════════════
