import os
import json
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

def main(context):
    """
    Appwrite function to download and use Qwen2.5-0.5B-Instruct model
    Prompts the model with "hello" and returns the response
    """

    try:
        # Model configuration
        model_name = "Qwen/Qwen2.5-0.5B-Instruct"
        cache_dir = "/tmp/model_cache"  # Use /tmp for temporary storage in serverless

        # Ensure cache directory exists
        os.makedirs(cache_dir, exist_ok=True)

        context.log(f"Downloading model: {model_name}")

        # Load tokenizer and model
        tokenizer = AutoTokenizer.from_pretrained(
            model_name,
            cache_dir=cache_dir,
            trust_remote_code=True
        )

        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            cache_dir=cache_dir,
            trust_remote_code=True,
            torch_dtype=torch.float16,  # Use float16 for memory efficiency
            device_map="auto"  # Auto-detect available device
        )

        context.log("Model loaded successfully")

        # Prepare the prompt
        prompt = "hello"

        # Tokenize the input
        inputs = tokenizer(prompt, return_tensors="pt")

        # Move inputs to the same device as the model
        if torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            inputs = {k: v.to('mps') for k, v in inputs.items()}

        context.log("Generating response...")

        # Generate response
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=100,
                temperature=0.7,
                do_sample=True,
                top_p=0.9,
                pad_token_id=tokenizer.eos_token_id
            )

        # Decode the response
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)

        # Extract only the generated part (remove the input prompt)
        generated_text = response[len(prompt):].strip()

        context.log(f"Generated response: {generated_text}")

        # Return the response
        return context.res.json({
            "success": True,
            "prompt": prompt,
            "response": generated_text,
            "model": model_name
        })

    except Exception as e:
        context.error(f"Error in Qwen function: {str(e)}")
        return context.res.json({
            "success": False,
            "error": str(e),
            "model": model_name
        }, 500)
