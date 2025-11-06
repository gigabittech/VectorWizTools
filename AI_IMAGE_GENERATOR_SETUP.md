# AI Image Generator - Setup Guide

## Overview

The AI Image Generator tool supports multiple AI providers for generating images from text descriptions:

- **OpenAI DALL-E 3** (Recommended) - Highest quality, most detailed images
- **OpenAI DALL-E 2** - Fast and cost-effective alternative
- **Stability AI (Stable Diffusion)** - Open source alternative

## Environment Variables

Add the following environment variables to your `.env` file:

### For OpenAI (DALL-E 3 or DALL-E 2)

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**How to get an OpenAI API key:**
1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new secret key
5. Copy and paste it into your `.env` file

### For Stability AI (Stable Diffusion)

```env
STABILITY_AI_API_KEY=sk-your-stability-ai-api-key-here
```

**How to get a Stability AI API key:**
1. Go to https://platform.stability.ai/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste it into your `.env` file

### Optional: Replicate API

```env
REPLICATE_API_TOKEN=r8_your-replicate-token-here
```

**Note:** You only need to configure the API keys for the providers you want to use. The tool will automatically use the available provider based on the selected model.

## Features

### DALL-E 3 Features
- **Quality Options:** Standard or HD
- **Style Options:** Vivid (hyper-real) or Natural
- **Size Options:** 
  - 1024×1024 (Square)
  - 1792×1024 (Landscape)
  - 1024×1792 (Portrait)
- **Prompt Limit:** Up to 4000 characters

### DALL-E 2 Features
- **Multiple Images:** Generate 1-10 variations
- **Size Options:** 256×256, 512×512, 1024×1024
- **Prompt Limit:** Up to 1000 characters

### Stable Diffusion Features
- **Custom Sizes:** Flexible dimensions
- **Open Source:** Community-driven

## Usage

1. Navigate to `/tools/ai-image-generator`
2. Enter a detailed description of the image you want to generate
3. Select your preferred AI model
4. Choose image size and quality settings
5. Click "Generate Image"
6. Download your generated image

## Tips for Better Results

- **Be Specific:** Include details about style, colors, lighting, and mood
- **Use Descriptive Words:** "vibrant", "minimalist", "cinematic", "watercolor"
- **Mention Composition:** "close-up", "wide angle", "centered", "rule of thirds"
- **Specify Art Style:** "photorealistic", "digital art", "oil painting", "sketch"

## API Costs

### OpenAI DALL-E 3
- Standard: $0.040 per image
- HD: $0.080 per image

### OpenAI DALL-E 2
- 1024×1024: $0.020 per image
- 512×512: $0.018 per image
- 256×256: $0.016 per image

### Stability AI
- Pricing varies by model and resolution
- Check https://platform.stability.ai/pricing for current rates

## Error Handling

The tool includes comprehensive error handling:
- Validates prompt length (minimum 10 characters)
- Checks API key configuration
- Handles API rate limits
- Provides user-friendly error messages

## Security Notes

- **Never commit API keys to version control**
- Store API keys in `.env` file (already in `.gitignore`)
- Use environment variables in production
- Consider implementing rate limiting for production use
- Monitor API usage to prevent unexpected costs

## Troubleshooting

### "API key not configured" error
- Make sure your `.env` file contains the correct API key
- Restart your development server after adding environment variables
- Check that the variable name matches exactly (case-sensitive)

### "Failed to generate image" error
- Check your API key is valid and has sufficient credits
- Verify your internet connection
- Check API service status
- Review error message for specific details

### Rate limit errors
- Wait a few moments and try again
- Consider upgrading your API plan for higher limits
- Implement request queuing for production

## Production Considerations

1. **Rate Limiting:** Implement rate limiting to prevent abuse
2. **Cost Monitoring:** Set up alerts for API usage
3. **Caching:** Cache generated images to reduce API calls
4. **Image Storage:** Store generated images in cloud storage (S3, GCS)
5. **User Limits:** Implement daily/monthly generation limits per user
6. **Content Moderation:** Add content filtering for inappropriate prompts

## Support

For issues or questions:
- Check the API provider documentation
- Review error messages in the browser console
- Check server logs for detailed error information

