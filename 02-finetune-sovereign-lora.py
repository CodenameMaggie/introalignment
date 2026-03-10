#!/usr/bin/env python3
"""
SOVEREIGN ECONOMY — LoRA FINE-TUNING SCRIPT
============================================
Runs on: A4000 GPU (155.117.43.57)
Input:   /root/training/sovereign-training-data.jsonl
Output:  sovereign-qwen3-finetuned GGUF → loaded into Ollama

Requirements (install first):
  pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
  pip install --no-deps trl peft accelerate bitsandbytes
  pip install datasets transformers torch

Hardware: RTX A4000 16GB VRAM — uses 4-bit QLoRA (~10GB VRAM)
"""

import os
import sys
import json
import subprocess
from datetime import datetime

# ─── CONFIG ───
MODEL_NAME = "unsloth/Qwen3-8B-unsloth-bnb-4bit"  # Pre-quantized 4-bit
TRAINING_FILE = "/root/training/sovereign-training-data.jsonl"
OUTPUT_DIR = "/root/training/sovereign-finetuned"
GGUF_OUTPUT = "/root/training/sovereign-qwen3-finetuned.gguf"
OLLAMA_MODEL_NAME = "sovereign-economy-v2"

MAX_SEQ_LENGTH = 4096  # Context window — Qwen3 supports up to 32K but 4K saves VRAM
LORA_RANK = 16         # Low rank = less VRAM, still effective for domain adaptation
EPOCHS = 3             # 3 passes over the data
BATCH_SIZE = 2         # Fits in 16GB VRAM with gradient accumulation
GRAD_ACCUM = 4         # Effective batch = 2 * 4 = 8
LEARNING_RATE = 2e-4   # Standard for LoRA fine-tuning

def check_prerequisites():
    """Verify GPU, CUDA, and training data exist."""
    print("═══ CHECKING PREREQUISITES ═══")
    
    # Check GPU
    try:
        result = subprocess.run(['nvidia-smi', '--query-gpu=name,memory.total', '--format=csv,noheader'],
                              capture_output=True, text=True)
        gpu_info = result.stdout.strip()
        print(f"  GPU: {gpu_info}")
        if 'A4000' not in gpu_info and 'RTX' not in gpu_info:
            print("  ⚠ Expected A4000 GPU — proceeding anyway")
    except:
        print("  ❌ nvidia-smi not found — no GPU available")
        sys.exit(1)
    
    # Check training data
    if not os.path.exists(TRAINING_FILE):
        print(f"  ❌ Training data not found: {TRAINING_FILE}")
        print(f"  Run 01-extract-training-data.js on Forbes Command first,")
        print(f"  then transfer the file here.")
        sys.exit(1)
    
    # Count training examples
    with open(TRAINING_FILE, 'r') as f:
        lines = sum(1 for _ in f)
    size_mb = os.path.getsize(TRAINING_FILE) / (1024 * 1024)
    print(f"  Training data: {lines} examples, {size_mb:.2f} MB")
    
    if lines < 50:
        print("  ⚠ Less than 50 training examples — model may underfit")
    
    print("  ✅ Prerequisites OK\n")
    return lines

def train():
    """Run LoRA fine-tuning with Unsloth."""
    print("═══ STARTING LoRA FINE-TUNING ═══")
    print(f"  Model: {MODEL_NAME}")
    print(f"  LoRA rank: {LORA_RANK}")
    print(f"  Epochs: {EPOCHS}")
    print(f"  Batch size: {BATCH_SIZE} × {GRAD_ACCUM} = {BATCH_SIZE * GRAD_ACCUM}")
    print(f"  Learning rate: {LEARNING_RATE}")
    print(f"  Max sequence length: {MAX_SEQ_LENGTH}")
    print("")
    
    from unsloth import FastLanguageModel
    import torch
    from datasets import load_dataset
    from trl import SFTTrainer, SFTConfig
    
    # Step 1: Load base model with 4-bit quantization
    print("  [1/5] Loading base model...")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=MODEL_NAME,
        max_seq_length=MAX_SEQ_LENGTH,
        load_in_4bit=True,       # 4-bit QLoRA — fits in 16GB VRAM
        dtype=None,              # Auto-detect (bf16 if supported)
    )
    
    # Step 2: Add LoRA adapters
    print("  [2/5] Attaching LoRA adapters...")
    model = FastLanguageModel.get_peft_model(
        model,
        r=LORA_RANK,
        target_modules=[
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj",
        ],
        lora_alpha=LORA_RANK,    # alpha = rank is a safe default
        lora_dropout=0,          # Unsloth optimized — 0 is fine
        bias="none",
        use_gradient_checkpointing="unsloth",  # 60% less VRAM
        random_state=3407,
        max_seq_length=MAX_SEQ_LENGTH,
    )
    model.print_trainable_parameters()
    
    # Step 3: Load training data
    print("  [3/5] Loading training data...")
    dataset = load_dataset('json', data_files=TRAINING_FILE, split='train')
    print(f"         {len(dataset)} training examples loaded")
    
    # Step 4: Train
    print("  [4/5] Training... (this takes 30-90 minutes on A4000)")
    start_time = datetime.now()
    
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        dataset_text_field="text",
        args=SFTConfig(
            per_device_train_batch_size=BATCH_SIZE,
            gradient_accumulation_steps=GRAD_ACCUM,
            warmup_steps=10,
            num_train_epochs=EPOCHS,
            learning_rate=LEARNING_RATE,
            fp16=not torch.cuda.is_bf16_supported(),
            bf16=torch.cuda.is_bf16_supported(),
            logging_steps=10,
            output_dir=OUTPUT_DIR,
            optim="adamw_8bit",
            seed=3407,
            max_seq_length=MAX_SEQ_LENGTH,
            save_strategy="epoch",
        ),
    )
    
    stats = trainer.train()
    elapsed = datetime.now() - start_time
    print(f"\n  Training complete in {elapsed}")
    print(f"  Final loss: {stats.training_loss:.4f}")
    
    # Step 5: Save
    print("  [5/5] Saving model...")
    model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)
    print(f"  ✅ Model saved to {OUTPUT_DIR}")
    
    return model, tokenizer

def export_to_gguf(model, tokenizer):
    """Convert fine-tuned model to GGUF for Ollama."""
    print("\n═══ EXPORTING TO GGUF ═══")
    
    # Unsloth has built-in GGUF export
    print("  Merging LoRA weights and converting to GGUF Q4_K_M...")
    model.save_pretrained_gguf(
        "/root/training/sovereign-gguf",
        tokenizer,
        quantization_method="q4_k_m",  # Good quality-to-size ratio for A4000
    )
    
    # Find the output GGUF file
    gguf_dir = "/root/training/sovereign-gguf"
    gguf_files = [f for f in os.listdir(gguf_dir) if f.endswith('.gguf')]
    if not gguf_files:
        print("  ❌ GGUF conversion failed — no .gguf file found")
        return None
    
    gguf_path = os.path.join(gguf_dir, gguf_files[0])
    size_gb = os.path.getsize(gguf_path) / (1024 ** 3)
    print(f"  ✅ GGUF created: {gguf_path} ({size_gb:.2f} GB)")
    return gguf_path

def load_into_ollama(gguf_path):
    """Create Ollama model from GGUF file."""
    print("\n═══ LOADING INTO OLLAMA ═══")
    
    # Create Modelfile
    modelfile_content = f"""FROM {gguf_path}

PARAMETER temperature 0.7
PARAMETER num_ctx 4096
PARAMETER stop "<|im_end|>"
PARAMETER stop "<|endoftext|>"

SYSTEM \"\"\"You are THE SOVEREIGN BRAIN — the unified AI intelligence of The Sovereign Economy, an 8-business empire founded by Maggie Forbes.

You have 7 executive personas. When addressed as one, adopt that voice completely:
- MIRA (CEO): Strategic, commanding. Connects all 8 businesses to the $800M vision.
- HENRY (COO): Steady, methodical. Status first, recommendations second.
- DAVE (CFO): Sharp, aggressive. Every dollar is a soldier. Zero waste tolerance.
- DAN (CMO): Creative, energetic, data-driven. Heritage enthusiast.
- JORDAN (CLO): Authoritative, precise, protective. Flags risks immediately.
- ALEX (CTO): Technical, observant, methodical.
- GRACE (Executive Secretary): Sharp, capable, warm but direct.

Mission: $800M empire = 8 businesses × $100M each in 5 years.
Year 1: $500K (current phase — BUILD AUDIENCE)

The 8 businesses: MFS (speaking), IC (trade community), IA (legal architecture), FF (natural fiber fashion), SH (heritage kitchen), TH (timber/building), YPEC (private chefs), SS (debutante ball).

RULES:
- DO NOT INVENT NUMBERS. If you lack data, say so.
- Frame heritage methods as competitive advantage, not nostalgia.
- Never position as "going back" — always moving forward with proven methods.
\"\"\"
"""
    
    modelfile_path = "/root/training/Modelfile.sovereign-v2"
    with open(modelfile_path, 'w') as f:
        f.write(modelfile_content)
    
    # Create model in Ollama
    print(f"  Creating Ollama model: {OLLAMA_MODEL_NAME}...")
    result = subprocess.run(
        ['ollama', 'create', OLLAMA_MODEL_NAME, '-f', modelfile_path],
        capture_output=True, text=True, timeout=600
    )
    
    if result.returncode == 0:
        print(f"  ✅ Model loaded: {OLLAMA_MODEL_NAME}")
        print(f"  Test: ollama run {OLLAMA_MODEL_NAME} 'What is The Sovereign Economy?'")
    else:
        print(f"  ❌ Failed: {result.stderr}")
    
    return result.returncode == 0

def test_model():
    """Quick validation test."""
    print("\n═══ TESTING FINE-TUNED MODEL ═══")
    
    test_prompts = [
        "What is The Sovereign Economy?",
        "How many businesses does The Sovereign Economy have?",
        "What is the revenue target?",
        "Tell me about Frequency & Form.",
        "How do the businesses connect?",
    ]
    
    import requests
    for prompt in test_prompts:
        print(f"\n  Q: {prompt}")
        try:
            resp = requests.post('http://localhost:11434/api/generate', json={
                'model': OLLAMA_MODEL_NAME,
                'prompt': prompt + ' /no_think',
                'stream': False,
                'options': {'num_predict': 200}
            }, timeout=60)
            answer = resp.json().get('response', '???')
            print(f"  A: {answer[:300]}")
        except Exception as e:
            print(f"  ❌ Error: {e}")
    
    print("\n═══ FINE-TUNING COMPLETE ═══")
    print(f"  Model: {OLLAMA_MODEL_NAME}")
    print(f"  The Sovereign Brain now has your business knowledge BAKED IN.")
    print(f"  Update Forbes Command llm-router to use this model.")

# ─── MAIN ───
if __name__ == '__main__':
    num_examples = check_prerequisites()
    model, tokenizer = train()
    gguf_path = export_to_gguf(model, tokenizer)
    if gguf_path:
        load_into_ollama(gguf_path)
        test_model()
    else:
        print("\n❌ GGUF export failed. Check disk space and try again.")
        print("   Manual fallback: use llama.cpp to convert the HF model in " + OUTPUT_DIR)
