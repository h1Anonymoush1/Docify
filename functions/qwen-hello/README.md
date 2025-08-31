# Qwen Hello Function

This Appwrite function downloads and uses the Qwen2.5-0.5B-Instruct model to respond to the prompt "hello".

## Features

- Downloads the Qwen/Qwen2.5-0.5B-Instruct model from Hugging Face
- Prompts the model with "hello"
- Returns the model's generated response
- Optimized for serverless environments with memory-efficient settings

## Usage

### Deploy to Appwrite

1. Create a new function in your Appwrite console
2. Set the runtime to Python
3. Upload the function files or connect via Git
4. Deploy the function

### API Response

The function returns a JSON response:

```json
{
  "success": true,
  "prompt": "hello",
  "response": "Hello! How can I help you today?",
  "model": "Qwen/Qwen2.5-0.5B-Instruct"
}
```

## Dependencies

- transformers: For model and tokenizer
- torch: PyTorch for inference
- accelerate: For device mapping and optimization
- tokenizers: For efficient tokenization

## Notes

- The model is cached in `/tmp/model_cache` for serverless environments
- Uses float16 precision for memory efficiency
- Automatically detects available hardware (CUDA, MPS, or CPU)
- Generation parameters are optimized for coherent responses
