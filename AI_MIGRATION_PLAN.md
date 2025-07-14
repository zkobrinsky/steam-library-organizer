# AI Migration Plan: OpenAI → Hugging Face

## Project Overview
Migrate Steam Library Organizer from OpenAI GPT-4 to Hugging Face models for cost efficiency and customization potential.

## Current State
- **Chat**: OpenAI GPT-4-turbo-preview
- **Recommendations**: OpenAI GPT-4-turbo-preview  
- **Files**: `/server/api/chat.post.ts`, `/server/api/recommendations.post.ts`
- **Cost**: ~$0.02 per 1K tokens

## Migration Phases

### Phase 1: Basic HF Integration ⏳ IN PROGRESS
**Models:**
- Chat: `microsoft/DialoGPT-medium` 
- Recommendations: `google/flan-t5-large`

**Tasks:**
- [x] Install @huggingface/inference SDK
- [x] Update .env configuration  
- [ ] Update chat.post.ts for DialoGPT-medium
- [ ] Update recommendations.post.ts for flan-t5-large
- [ ] Test with real Steam data
- [ ] Verify response quality

**Benefits:**
- ~80% cost reduction
- No approval requirements
- Fast implementation

### Phase 2: Production Ready 📋 PLANNED
**Models:**
- Chat: `HuggingFaceH4/zephyr-7b-beta`
- Recommendations: `meta-llama/Llama-2-7b-chat-hf`

**Tasks:**
- [ ] Request Llama model access
- [ ] Implement zephyr-7b for chat
- [ ] Implement Llama-2 for recommendations
- [ ] Performance comparison testing
- [ ] User experience validation

**Benefits:**
- Better reasoning capabilities
- Improved gaming context understanding
- Still ~60% cost reduction vs OpenAI

### Phase 3: Custom Solution 🔮 FUTURE
**Models:**
- Custom fine-tuned model on Steam review data
- Base: `mistralai/Mistral-7B-Instruct-v0.1`

**Tasks:**
- [ ] Collect Steam review dataset
- [ ] Design fine-tuning pipeline
- [ ] Train custom gaming model
- [ ] Deploy to HF Inference Endpoints
- [ ] A/B test vs Phase 2 models

**Benefits:**
- Steam-specific vocabulary
- Gaming terminology understanding
- Optimal for Steam Library use case

## Technical Details

### Current Integration Points
```javascript
// chat.post.ts:42 - Main chat completion
// recommendations.post.ts:38 - Recommendation generation
```

### Environment Configuration
```env
HUGGINGFACE_API_KEY=your_token_here
HF_MODEL_CHAT=microsoft/DialoGPT-medium
HF_MODEL_RECOMMENDATIONS=google/flan-t5-large
```

### Cost Analysis
| Phase | Chat Model | Rec Model | Est. Cost/1K tokens | Savings |
|-------|------------|-----------|-------------------|---------|
| Current | GPT-4-turbo | GPT-4-turbo | ~$0.020 | - |
| Phase 1 | DialoGPT-med | flan-t5-large | ~$0.004 | 80% |
| Phase 2 | zephyr-7b | Llama-2-7b | ~$0.008 | 60% |
| Phase 3 | Custom model | Custom model | ~$0.006 | 70% |

## Success Metrics
- [ ] Response quality maintained (user feedback)
- [ ] Response time < 3 seconds
- [ ] Cost reduction achieved
- [ ] No breaking changes to frontend
- [ ] Error rates < 1%

## Rollback Plan
Keep OpenAI integration as fallback:
- Environment flag to switch between providers
- Gradual migration with A/B testing
- Immediate rollback capability

---
**Started:** 2025-07-11  
**Current Phase:** Phase 1 Implementation  
**Next Review:** After Phase 1 completion