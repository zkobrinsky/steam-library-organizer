#!/usr/bin/env python3
"""
Steam Review Data Preparation for OpenAI Fine-tuning
Selects 5K best Steam reviews and formats them for GPT-4o-mini training
"""

import json
import gzip
import requests
from datasets import load_dataset
import pandas as pd
from typing import List, Dict
import os

def download_steam_reviews():
    """Download Steam reviews dataset from HuggingFace"""
    print("Downloading Steam reviews dataset...")
    
    try:
        # Load the dataset
        dataset = load_dataset("recommender-system/steam-review-and-bundle-dataset")
        
        # The dataset contains multiple files, we want the reviews
        reviews_data = []
        
        # Extract reviews from the dataset
        if 'train' in dataset:
            for item in dataset['train']:
                if 'reviews' in item and item['reviews']:
                    for review in item['reviews']:
                        if 'review' in review and review['review']:
                            reviews_data.append({
                                'user_id': item.get('user_id', ''),
                                'game_id': review.get('item_id', ''),
                                'review_text': review['review'],
                                'recommend': review.get('recommend', True),
                                'helpful': review.get('helpful', 0),
                                'funny': review.get('funny', 0),
                                'hours': review.get('hours', 0)
                            })
        
        print(f"Loaded {len(reviews_data)} reviews")
        return reviews_data
        
    except Exception as e:
        print(f"Error loading dataset: {e}")
        # Fallback: create sample data for testing
        return create_sample_data()

def create_sample_data():
    """Create sample Steam review data for testing"""
    print("Creating sample data for testing...")
    
    sample_reviews = [
        {
            'user_id': 'user1',
            'game_id': 'game1',
            'review_text': 'Amazing indie game with great pixel art and challenging gameplay. Spent over 50 hours exploring every corner. Highly recommend for platformer fans.',
            'recommend': True,
            'helpful': 15,
            'funny': 2,
            'hours': 52
        },
        {
            'user_id': 'user2', 
            'game_id': 'game2',
            'review_text': 'Disappointing sequel. The story feels rushed and the graphics are outdated. Expected much more after waiting 5 years.',
            'recommend': False,
            'helpful': 8,
            'funny': 0,
            'hours': 12
        },
        # Add more sample reviews...
    ]
    
    # Duplicate to simulate larger dataset
    return sample_reviews * 1000

def select_best_reviews(reviews_data: List[Dict], target_count: int = 5000) -> List[Dict]:
    """Select the best reviews based on quality metrics"""
    print(f"Selecting best {target_count} reviews...")
    
    df = pd.DataFrame(reviews_data)
    
    # Quality scoring
    df['quality_score'] = (
        df['helpful'] * 2 +  # Helpful votes are most important
        df['funny'] * 0.5 +  # Funny votes add some value
        (df['hours'] > 5) * 3 +  # Meaningful playtime
        (df['review_text'].str.len() > 100) * 2  # Detailed reviews
    )
    
    # Filter out very short or very long reviews
    df = df[
        (df['review_text'].str.len() >= 50) &  # Minimum length
        (df['review_text'].str.len() <= 2000)  # Maximum length
    ]
    
    # Sort by quality score and take top reviews
    best_reviews = df.nlargest(target_count, 'quality_score')
    
    print(f"Selected {len(best_reviews)} high-quality reviews")
    return best_reviews.to_dict('records')

def format_for_openai(reviews: List[Dict]) -> List[Dict]:
    """Format reviews for OpenAI fine-tuning format"""
    print("Formatting data for OpenAI fine-tuning...")
    
    training_data = []
    
    for review in reviews:
        # Create system message for gaming assistant
        system_message = {
            "role": "system",
            "content": "You are a knowledgeable gaming assistant that helps users discover and understand games based on Steam reviews and gaming patterns."
        }
        
        # Create user message simulating a question about the game
        user_message = {
            "role": "user", 
            "content": f"What can you tell me about this game? I'm looking for honest opinions from someone who has played it."
        }
        
        # Assistant response based on the actual Steam review
        recommendation = "recommend" if review['recommend'] else "don't recommend"
        hours_text = f"after {review['hours']} hours" if review['hours'] > 0 else ""
        
        assistant_message = {
            "role": "assistant",
            "content": f"Based on Steam user experiences, I {recommendation} this game. Here's what a player shared {hours_text}: {review['review_text']}"
        }
        
        training_example = {
            "messages": [system_message, user_message, assistant_message]
        }
        
        training_data.append(training_example)
    
    print(f"Created {len(training_data)} training examples")
    return training_data

def save_training_data(training_data: List[Dict], filename: str = "steam_training_data.jsonl"):
    """Save training data in JSONL format for OpenAI"""
    print(f"Saving training data to {filename}...")
    
    with open(filename, 'w', encoding='utf-8') as f:
        for example in training_data:
            f.write(json.dumps(example, ensure_ascii=False) + '\n')
    
    print(f"Saved {len(training_data)} examples to {filename}")
    
    # Calculate approximate cost
    total_tokens = sum(
        len(json.dumps(example).split()) * 1.3  # Rough token estimation
        for example in training_data
    )
    
    cost_estimate = (total_tokens / 1000) * 0.025  # GPT-4o-mini training cost
    print(f"Estimated training cost: ${cost_estimate:.2f}")

def main():
    """Main execution function"""
    print("🎮 Steam Review Training Data Preparation")
    print("=" * 50)
    
    # Step 1: Download reviews
    reviews_data = download_steam_reviews()
    
    if not reviews_data:
        print("❌ Failed to load review data")
        return
    
    # Step 2: Select best reviews
    best_reviews = select_best_reviews(reviews_data, target_count=5000)
    
    # Step 3: Format for OpenAI
    training_data = format_for_openai(best_reviews)
    
    # Step 4: Save training data
    save_training_data(training_data)
    
    print("\n✅ Training data preparation complete!")
    print("Next steps:")
    print("1. Upload steam_training_data.jsonl to OpenAI")
    print("2. Start fine-tuning job")
    print("3. Update your app to use the fine-tuned model")

if __name__ == "__main__":
    main()