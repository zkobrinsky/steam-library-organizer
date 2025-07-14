# Steam Model Training

This directory contains scripts to fine-tune GPT-4o-mini on Steam review data for better gaming recommendations.

## Setup

1. **Install dependencies with uv:**
```bash
cd model-training
uv sync
```

2. **Set OpenAI API key:**
```bash
export OPENAI_API_KEY='your-openai-api-key-here'
```

## Usage

1. **Prepare training data:**
```bash
uv run prepare_training_data.py
```
- Downloads 7.8M Steam reviews from HuggingFace
- Selects 5K highest-quality reviews
- Formats for OpenAI fine-tuning
- Saves to `steam_training_data.jsonl`

2. **Train the model:**
```bash
uv run train_model.py
```
- Uploads training data to OpenAI
- Starts GPT-4o-mini fine-tuning (~$25)
- Monitors training progress
- Saves model ID to `fine_tuned_model_id.txt`

## Cost Estimate
- **5K reviews**: ~$25 for GPT-4o-mini training
- **Training time**: 2-4 hours
- **Usage cost**: ~5x base model rate

## Output
After training completes, you'll get a fine-tuned model ID like:
```
ft:gpt-4o-mini-2024-07-18:your-org::xxxxxxxx
```

Add this to your main app's `.env`:
```
OPENAI_FINETUNED_MODEL=ft:gpt-4o-mini-2024-07-18:your-org::xxxxxxxx
```