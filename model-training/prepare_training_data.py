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
        # Load the working dataset
        dataset = load_dataset("ksang/steamreviews")
        
        reviews_data = []
        
        # Extract reviews from the dataset
        if 'train' in dataset:
            for item in dataset['train']:
                if item.get('review_text') and len(item.get('review_text', '')) > 20:  # Filter out empty/short reviews
                    reviews_data.append({
                        'user_id': str(item.get('app_id', '')),  # Use app_id as identifier
                        'game_id': item.get('app_id', ''),
                        'game_name': item.get('app_name', ''),
                        'review_text': item.get('review_text', ''),
                        'recommend': item.get('review_score', 0) >= 1,  # 1 = positive, -1 = negative
                        'helpful': item.get('review_votes', 0),
                        'funny': 0,  # Not available in this dataset
                        'hours': 0   # Not available in this dataset
                    })
        
        print(f"Loaded {len(reviews_data)} reviews")
        return reviews_data
        
    except Exception as e:
        print(f"Error loading dataset: {e}")
        print("Falling back to sample data...")
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

def select_diverse_reviews(reviews_data: List[Dict], target_count: int = 1000) -> List[Dict]:
    """Select diverse, high-quality reviews for gaming pattern analysis"""
    print(f"Selecting {target_count} diverse reviews for gaming intelligence training...")
    
    df = pd.DataFrame(reviews_data)
    
    # Filter for substantive reviews
    df = df[
        (df['review_text'].str.len() >= 100) &  # Detailed reviews only
        (df['review_text'].str.len() <= 1500) &  # Not too long
        (df['helpful'] >= 1)  # At least some community validation
    ]
    
    # Create diversity categories for better training coverage
    df['review_length_category'] = pd.cut(df['review_text'].str.len(), bins=3, labels=['medium', 'long', 'detailed'])
    df['sentiment'] = df['recommend'].map({True: 'positive', False: 'negative'})
    
    # Sample diverse reviews across categories
    diverse_reviews = []
    
    # Get balanced sentiment
    positive_reviews = df[df['sentiment'] == 'positive'].sample(min(target_count//2, len(df[df['sentiment'] == 'positive'])))
    negative_reviews = df[df['sentiment'] == 'negative'].sample(min(target_count//2, len(df[df['sentiment'] == 'negative'])))
    
    # Combine and shuffle
    selected_df = pd.concat([positive_reviews, negative_reviews]).sample(frac=1).head(target_count)
    
    print(f"Selected {len(selected_df)} diverse reviews")
    print(f"Positive: {len(selected_df[selected_df['sentiment'] == 'positive'])}, Negative: {len(selected_df[selected_df['sentiment'] == 'negative'])}")
    
    return selected_df.to_dict('records')

def format_for_gaming_intelligence(reviews: List[Dict]) -> List[Dict]:
    """Format reviews to teach gaming analysis patterns and terminology"""
    print("Creating gaming intelligence training examples...")
    
    training_data = []
    
    # Gaming analysis patterns to teach
    patterns = [
        {
            "user_pattern": "analyze_game_quality",
            "questions": [
                "What should I look for in game reviews to identify quality?",
                "How can I tell if a game is worth buying from reviews?",
                "What are red flags in game reviews I should avoid?"
            ]
        },
        {
            "user_pattern": "recommendation_matching", 
            "questions": [
                "I like {positive_aspects}, what type of games should I look for?",
                "What games would suit someone who enjoys {positive_aspects}?",
                "I'm looking for games that are {positive_aspects}"
            ]
        },
        {
            "user_pattern": "gaming_terminology",
            "questions": [
                "What does it mean when reviewers say a game is {key_phrase}?",
                "Explain this gaming term: {key_phrase}",
                "What should I expect from games described as {key_phrase}?"
            ]
        }
    ]
    
    for review in reviews:
        # Extract gaming insights from each review
        insights = extract_gaming_insights(review)
        
        # Create multiple training examples per review
        for pattern in patterns:
            example = create_training_example(review, insights, pattern)
            if example:
                training_data.append(example)
    
    print(f"Created {len(training_data)} gaming intelligence examples")
    return training_data

def extract_gaming_insights(review: Dict) -> Dict:
    """Extract key gaming concepts and patterns from a review"""
    text = review['review_text'].lower()
    game_name = review.get('game_name', 'this game')
    recommend = review['recommend']
    
    # Extract key gaming concepts mentioned
    gaming_keywords = {
        'gameplay': ['gameplay', 'mechanics', 'controls', 'combat', 'strategy'],
        'difficulty': ['easy', 'hard', 'challenging', 'difficult', 'steep learning curve', 'accessible'],
        'replay_value': ['replay', 'replayability', 'hours', 'addictive', 'repetitive'],
        'graphics': ['graphics', 'visuals', 'art style', 'beautiful', 'ugly'],
        'story': ['story', 'narrative', 'plot', 'characters', 'writing'],
        'multiplayer': ['multiplayer', 'online', 'co-op', 'pvp', 'community'],
        'performance': ['bugs', 'crashes', 'optimization', 'smooth', 'laggy']
    }
    
    mentioned_aspects = {}
    for category, keywords in gaming_keywords.items():
        mentioned_aspects[category] = any(keyword in text for keyword in keywords)
    
    # Extract sentiment indicators
    positive_indicators = ['great', 'amazing', 'excellent', 'love', 'recommend', 'fun', 'enjoyable']
    negative_indicators = ['bad', 'terrible', 'boring', 'frustrating', 'waste', 'disappointed']
    
    return {
        'game_name': game_name,
        'recommend': recommend,
        'mentioned_aspects': mentioned_aspects,
        'has_positive_language': any(word in text for word in positive_indicators),
        'has_negative_language': any(word in text for word in negative_indicators),
        'review_length': len(review['review_text']),
        'sample_text': review['review_text'][:200] + "..." if len(review['review_text']) > 200 else review['review_text']
    }

def create_training_example(review: Dict, insights: Dict, pattern: Dict) -> Dict:
    """Create a training example based on gaming intelligence patterns"""
    import random
    
    system_message = {
        "role": "system",
        "content": "You are an expert gaming advisor who helps users understand games and make informed decisions. You analyze gaming patterns, terminology, and player feedback to provide helpful insights."
    }
    
    if pattern["user_pattern"] == "analyze_game_quality":
        if insights['recommend']:
            question = random.choice(pattern["questions"])
            positive_aspects = []
            if insights['mentioned_aspects']['gameplay']: positive_aspects.append("solid gameplay mechanics")
            if insights['mentioned_aspects']['graphics']: positive_aspects.append("good visual presentation")
            if insights['mentioned_aspects']['story']: positive_aspects.append("engaging narrative")
            
            if positive_aspects:
                response = f"Look for reviews that mention {', '.join(positive_aspects[:2])}. For example, when players say things like '{insights['sample_text']}', it usually indicates a quality experience."
            else:
                return None
        else:
            question = "What are red flags in game reviews I should avoid?"
            negative_aspects = []
            if insights['mentioned_aspects']['performance']: negative_aspects.append("technical issues")
            if insights['has_negative_language']: negative_aspects.append("player frustration")
            
            if negative_aspects:
                response = f"Watch out for reviews mentioning {', '.join(negative_aspects)}. When players write things like '{insights['sample_text']}', it often signals potential problems."
            else:
                return None
    
    elif pattern["user_pattern"] == "recommendation_matching":
        if not insights['recommend']:
            return None
            
        positive_aspects = []
        if insights['mentioned_aspects']['gameplay']: positive_aspects.append("engaging gameplay")
        if insights['mentioned_aspects']['replay_value']: positive_aspects.append("high replay value")
        if insights['mentioned_aspects']['story']: positive_aspects.append("good storytelling")
        
        if not positive_aspects:
            return None
            
        question = f"I like {', '.join(positive_aspects[:2])}, what type of games should I look for?"
        response = f"Based on player feedback, look for games where reviewers specifically mention {', '.join(positive_aspects[:2])}. Games like {insights['game_name']} get positive reviews when players say things like '{insights['sample_text']}'"
    
    elif pattern["user_pattern"] == "gaming_terminology":
        # Extract a key phrase from the review for terminology explanation
        key_phrases = []
        if 'addictive' in insights['sample_text'].lower(): key_phrases.append('addictive')
        if 'steep learning curve' in insights['sample_text'].lower(): key_phrases.append('steep learning curve')
        if 'replay value' in insights['sample_text'].lower(): key_phrases.append('replay value')
        
        if not key_phrases:
            return None
            
        key_phrase = random.choice(key_phrases)
        question = f"What does it mean when reviewers say a game is '{key_phrase}'?"
        
        if key_phrase == 'addictive':
            response = f"When players call a game 'addictive', they mean it has compelling gameplay loops that keep you coming back. As one player put it: '{insights['sample_text']}'"
        elif key_phrase == 'steep learning curve':
            response = f"A 'steep learning curve' means the game is challenging to master initially. Players often mention this when describing complex games: '{insights['sample_text']}'"
        else:
            response = f"The term '{key_phrase}' in gaming reviews typically refers to how much long-term enjoyment a game provides. Here's how one player described it: '{insights['sample_text']}'"
    
    else:
        return None
    
    return {
        "messages": [
            system_message,
            {"role": "user", "content": question},
            {"role": "assistant", "content": response}
        ]
    }

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
    
    # Step 2: Select diverse reviews for gaming intelligence 
    diverse_reviews = select_diverse_reviews(reviews_data, target_count=2000)
    
    # Step 3: Create gaming intelligence training examples
    training_data = format_for_gaming_intelligence(diverse_reviews)
    
    # Step 4: Save training data
    save_training_data(training_data)
    
    print("\n✅ Training data preparation complete!")
    print("Next steps:")
    print("1. Upload steam_training_data.jsonl to OpenAI")
    print("2. Start fine-tuning job")
    print("3. Update your app to use the fine-tuned model")

if __name__ == "__main__":
    main()