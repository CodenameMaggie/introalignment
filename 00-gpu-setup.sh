#!/bin/bash
# ═══════════════════════════════════════════════
# SOVEREIGN ECONOMY — A4000 GPU SETUP FOR FINE-TUNING
# ═══════════════════════════════════════════════
# Run on: A4000 GPU server (155.117.43.57)
# This installs everything needed for LoRA fine-tuning
# ═══════════════════════════════════════════════

set -e

echo "═══════════════════════════════════════════════"
echo "  SOVEREIGN ECONOMY — GPU FINE-TUNING SETUP"
echo "═══════════════════════════════════════════════"
echo ""

# ─── CHECK GPU ───
echo "[1/6] Checking GPU..."
if ! command -v nvidia-smi &> /dev/null; then
    echo "  ❌ nvidia-smi not found. Install NVIDIA drivers first."
    exit 1
fi
nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader
echo ""

# ─── CHECK PYTHON ───
echo "[2/6] Checking Python..."
python3 --version
pip3 --version 2>/dev/null || { echo "Installing pip..."; apt-get update && apt-get install -y python3-pip; }
echo ""

# ─── INSTALL PYTORCH WITH CUDA ───
echo "[3/6] Installing PyTorch with CUDA support..."
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121 --break-system-packages 2>/dev/null || \
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Verify CUDA
python3 -c "import torch; print(f'  PyTorch {torch.__version__}, CUDA available: {torch.cuda.is_available()}, Device: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else \"none\"}')"
echo ""

# ─── INSTALL UNSLOTH + TRAINING DEPS ───
echo "[4/6] Installing Unsloth and training dependencies..."
pip3 install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git" --break-system-packages 2>/dev/null || \
pip3 install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"

pip3 install --no-deps trl peft accelerate bitsandbytes --break-system-packages 2>/dev/null || \
pip3 install --no-deps trl peft accelerate bitsandbytes

pip3 install datasets transformers requests --break-system-packages 2>/dev/null || \
pip3 install datasets transformers requests
echo ""

# ─── PREPARE DIRECTORIES ───
echo "[5/6] Creating directories..."
mkdir -p /root/training
mkdir -p /root/models
echo "  /root/training — training data + scripts"
echo "  /root/models   — finished models"
echo ""

# ─── VERIFY OLLAMA ───
echo "[6/6] Checking Ollama..."
if command -v ollama &> /dev/null; then
    echo "  Ollama installed: $(ollama --version 2>/dev/null || echo 'unknown version')"
    ollama list 2>/dev/null || echo "  (Ollama not running — start with: ollama serve)"
else
    echo "  Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
    echo "  ✅ Ollama installed"
fi
echo ""

# ─── SUMMARY ───
echo "═══════════════════════════════════════════════"
echo "  ✅ GPU SETUP COMPLETE"
echo ""
echo "  Next steps:"
echo "  1. Transfer training data from Forbes Command:"
echo "     scp root@5.78.139.9:/root/mfs/data/training/sovereign-training-data.jsonl /root/training/"
echo ""
echo "  2. Transfer fine-tuning script:"
echo "     scp 02-finetune-sovereign-lora.py root@155.117.43.57:/root/training/"
echo ""
echo "  3. Run fine-tuning:"
echo "     cd /root/training && python3 02-finetune-sovereign-lora.py"
echo ""
echo "  Estimated time: 30-90 minutes depending on dataset size"
echo "═══════════════════════════════════════════════"
