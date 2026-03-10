# A4000 GPU SERVER — SSH ACCESS RECOVERY
# ========================================
# Server: 155.117.43.57 (DatabaseMart RTX A4000)
# Problem: SSH password unknown — currently API-only via Ollama port 11434
#
# THREE OPTIONS TO GET SSH ACCESS:

## OPTION 1: DatabaseMart Support (RECOMMENDED)
# 1. Log into your DatabaseMart dashboard: https://www.databasemart.com/client/
# 2. Find your GPU VPS order
# 3. Look for "Server Details" or "Credentials" — the root password should be there
# 4. If not visible, submit a support ticket:
#    Subject: "Need root SSH credentials for GPU VPS"
#    Include: Server IP 155.117.43.57, your account email
# 5. They typically respond within 1-4 hours

## OPTION 2: Reset Password via Dashboard
# Most VPS providers have a "Reset Root Password" option in the dashboard.
# 1. Log into DatabaseMart dashboard
# 2. Find your GPU VPS
# 3. Look for "Reinstall OS" or "Reset Password" button
# 4. This will generate a new root password
# ⚠ WARNING: "Reinstall OS" will WIPE the server — only do "Reset Password"

## OPTION 3: VNC/Console Access
# DatabaseMart may offer VNC or HTML5 console access in the dashboard.
# 1. Look for "Console" or "VNC" option in your server management panel
# 2. This gives you terminal access without SSH
# 3. Once in, reset the password: passwd root

# ═══════════════════════════════════════════════
# MEANWHILE: API-BASED MANAGEMENT (NO SSH NEEDED)
# ═══════════════════════════════════════════════

# The Ollama API on port 11434 is open, so we can do a LOT without SSH:

# CHECK MODELS:
curl -s http://155.117.43.57:11434/api/tags | python3 -c "import sys,json; [print(f'  {m[\"name\"]}') for m in json.load(sys.stdin).get('models',[])]"

# RUN A QUERY:
curl -s http://155.117.43.57:11434/api/generate -d '{"model":"qwen3:8b","prompt":"What is The Sovereign Economy? /no_think","stream":false}' | python3 -c "import sys,json; print(json.load(sys.stdin).get('response',''))"

# PULL A NEW MODEL:
curl -s http://155.117.43.57:11434/api/pull -d '{"name":"qwen3:14b"}' 

# CREATE A MODEL FROM MODELFILE (sent via API):
curl -s http://155.117.43.57:11434/api/create -d '{
  "name": "sovereign-economy-v2",
  "modelfile": "FROM qwen3:8b\nPARAMETER temperature 0.7\nSYSTEM \"You are THE SOVEREIGN BRAIN...\""
}'

# DELETE A MODEL:
curl -s http://155.117.43.57:11434/api/delete -d '{"name":"old-model-name"}'

# CHECK IF RUNNING:
curl -s http://155.117.43.57:11434/api/ps

# ═══════════════════════════════════════════════
# WHAT SSH ACCESS UNLOCKS (that API can't do):
# ═══════════════════════════════════════════════
# 1. Install Unsloth + fine-tuning dependencies (pip install)
# 2. Run the LoRA fine-tuning script (python3 02-finetune-sovereign-lora.py)
# 3. Transfer training data files (scp)
# 4. Install SadTalker for Martha lip-sync
# 5. Install ComfyUI / Stable Diffusion for image generation
# 6. Monitor GPU usage (nvidia-smi)
# 7. Set up cron jobs for automated retraining
# 8. Install llama.cpp for GGUF conversion
#
# PRIORITY: Get SSH access → this unblocks everything else.

# ═══════════════════════════════════════════════
# SSH KEY SETUP (once you have password)
# ═══════════════════════════════════════════════
# Run from Forbes Command:

# Generate key if you don't have one:
# ssh-keygen -t ed25519 -f /root/.ssh/gpu_key -N ""

# Copy key to GPU server (requires password once):
# ssh-copy-id -i /root/.ssh/gpu_key root@155.117.43.57

# Add to SSH config for easy access:
# cat >> /root/.ssh/config << 'SSHEOF'
# Host gpu
#   HostName 155.117.43.57
#   User root
#   IdentityFile /root/.ssh/gpu_key
# SSHEOF

# Now just: ssh gpu
# Or: scp training-data.jsonl gpu:/root/training/
