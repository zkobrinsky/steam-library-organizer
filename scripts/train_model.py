#!/usr/bin/env python3
"""
OpenAI Fine-tuning Script for Steam Gaming Assistant
Uploads training data and starts fine-tuning job
"""

import openai
import json
import time
import os
from typing import Optional

def setup_openai_client():
    """Initialize OpenAI client with API key"""
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("❌ OPENAI_API_KEY environment variable not set")
        print("Please set it with: export OPENAI_API_KEY='your-api-key'")
        return None
    
    client = openai.OpenAI(api_key=api_key)
    print("✅ OpenAI client initialized")
    return client

def upload_training_file(client: openai.OpenAI, filename: str = "steam_training_data.jsonl") -> Optional[str]:
    """Upload training data file to OpenAI"""
    print(f"📤 Uploading {filename}...")
    
    try:
        with open(filename, 'rb') as f:
            response = client.files.create(
                file=f,
                purpose='fine-tune'
            )
        
        file_id = response.id
        print(f"✅ File uploaded successfully: {file_id}")
        return file_id
        
    except FileNotFoundError:
        print(f"❌ File {filename} not found. Run prepare_training_data.py first.")
        return None
    except Exception as e:
        print(f"❌ Upload failed: {e}")
        return None

def start_fine_tuning(client: openai.OpenAI, file_id: str, model: str = "gpt-4o-mini-2024-07-18") -> Optional[str]:
    """Start fine-tuning job"""
    print(f"🚀 Starting fine-tuning with {model}...")
    
    try:
        response = client.fine_tuning.jobs.create(
            training_file=file_id,
            model=model,
            hyperparameters={
                "n_epochs": 3,  # 3 epochs should be sufficient for 5K examples
            }
        )
        
        job_id = response.id
        print(f"✅ Fine-tuning job started: {job_id}")
        print(f"🔗 Monitor progress: https://platform.openai.com/fine-tuning/{job_id}")
        return job_id
        
    except Exception as e:
        print(f"❌ Fine-tuning failed to start: {e}")
        return None

def monitor_training(client: openai.OpenAI, job_id: str):
    """Monitor fine-tuning progress"""
    print("📊 Monitoring training progress...")
    
    while True:
        try:
            response = client.fine_tuning.jobs.retrieve(job_id)
            status = response.status
            
            print(f"Status: {status}")
            
            if status == 'succeeded':
                model_id = response.fine_tuned_model
                print(f"🎉 Training completed successfully!")
                print(f"📝 Fine-tuned model: {model_id}")
                
                # Save model ID for later use
                with open('fine_tuned_model_id.txt', 'w') as f:
                    f.write(model_id)
                
                return model_id
                
            elif status == 'failed':
                print(f"❌ Training failed: {response.error}")
                return None
                
            elif status in ['validating_files', 'queued', 'running']:
                print("⏳ Training in progress... checking again in 60 seconds")
                time.sleep(60)
            else:
                print(f"⚠️ Unexpected status: {status}")
                time.sleep(30)
                
        except KeyboardInterrupt:
            print("\n⏹️ Monitoring stopped. Training continues in background.")
            print(f"📋 Job ID: {job_id}")
            print("Check status at: https://platform.openai.com/fine-tuning")
            break
        except Exception as e:
            print(f"Error checking status: {e}")
            time.sleep(30)

def estimate_cost(filename: str = "steam_training_data.jsonl"):
    """Estimate training cost"""
    try:
        with open(filename, 'r') as f:
            lines = f.readlines()
        
        total_tokens = 0
        for line in lines:
            data = json.loads(line)
            # Rough token estimation
            text = json.dumps(data)
            tokens = len(text.split()) * 1.3  # Conservative estimate
            total_tokens += tokens
        
        cost = (total_tokens / 1000) * 0.025  # GPT-4o-mini rate
        print(f"📊 Estimated tokens: {total_tokens:,.0f}")
        print(f"💰 Estimated cost: ${cost:.2f}")
        return cost
        
    except Exception as e:
        print(f"Error estimating cost: {e}")
        return None

def main():
    """Main execution function"""
    print("🤖 OpenAI Fine-tuning for Steam Gaming Assistant")
    print("=" * 55)
    
    # Check if training data exists
    if not os.path.exists('steam_training_data.jsonl'):
        print("❌ Training data not found. Run prepare_training_data.py first.")
        return
    
    # Estimate cost
    cost = estimate_cost()
    if cost and cost > 30:
        print(f"⚠️ Cost estimate (${cost:.2f}) exceeds $30. Consider reducing dataset size.")
        response = input("Continue anyway? (y/N): ")
        if response.lower() != 'y':
            print("Cancelled.")
            return
    
    # Setup OpenAI client
    client = setup_openai_client()
    if not client:
        return
    
    # Upload training file
    file_id = upload_training_file(client)
    if not file_id:
        return
    
    # Start fine-tuning
    job_id = start_fine_tuning(client, file_id)
    if not job_id:
        return
    
    # Monitor progress
    model_id = monitor_training(client, job_id)
    
    if model_id:
        print(f"\n🎯 Success! Your fine-tuned model is ready: {model_id}")
        print("💡 Update your app's .env file:")
        print(f"OPENAI_FINETUNED_MODEL={model_id}")

if __name__ == "__main__":
    main()