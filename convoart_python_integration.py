#!/usr/bin/env python3
"""
ConvoArt - Python Integration for DeepAI Text-to-Image API
This script provides a Python interface for the ConvoArt model using DeepAI's API.
"""

import requests
import json
import os
import sys
from typing import Optional, Union
from pathlib import Path

class ConvoArt:
    """
    ConvoArt model class for generating images from text using DeepAI API.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize ConvoArt with API key.
        
        Args:
            api_key: DeepAI API key. If not provided, will look for DEEPAI_API_KEY environment variable.
        """
        self.api_key = api_key or os.getenv('DEEPAI_API_KEY')
        if not self.api_key:
            raise ValueError("API key is required. Provide it as parameter or set DEEPAI_API_KEY environment variable.")
        
        self.base_url = "https://api.deepai.org/api/text2img"
        self.headers = {'api-key': self.api_key}
    
    def generate_from_text(self, prompt: str, save_path: Optional[str] = None) -> dict:
        """
        Generate image from text prompt.
        
        Args:
            prompt: Text description of the image to generate
            save_path: Optional path to save the generated image
            
        Returns:
            Dictionary containing the API response with image URL and metadata
        """
        if not prompt.strip():
            raise ValueError("Prompt cannot be empty")
        
        data = {'text': prompt}
        
        try:
            print(f"🎨 ConvoArt: Generating image from prompt: '{prompt[:50]}{'...' if len(prompt) > 50 else ''}'")
            
            response = requests.post(
                self.base_url,
                data=data,
                headers=self.headers,
                timeout=60
            )
            
            response.raise_for_status()
            result = response.json()
            
            print(f"✅ ConvoArt: Image generated successfully!")
            print(f"🔗 Image URL: {result.get('output_url', 'N/A')}")
            
            # Save image if path provided
            if save_path and result.get('output_url'):
                self._save_image(result['output_url'], save_path)
            
            return result
            
        except requests.RequestException as e:
            error_msg = f"❌ ConvoArt API Error: {str(e)}"
            print(error_msg)
            return {'error': error_msg, 'status': 'failed'}
        except Exception as e:
            error_msg = f"❌ ConvoArt Error: {str(e)}"
            print(error_msg)
            return {'error': error_msg, 'status': 'failed'}
    
    def generate_from_file(self, file_path: Union[str, Path], save_path: Optional[str] = None) -> dict:
        """
        Generate image from text file.
        
        Args:
            file_path: Path to text file containing the prompt
            save_path: Optional path to save the generated image
            
        Returns:
            Dictionary containing the API response with image URL and metadata
        """
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        if not file_path.suffix.lower() in ['.txt', '.md']:
            raise ValueError("File must be .txt or .md format")
        
        try:
            print(f"📄 ConvoArt: Reading prompt from file: {file_path.name}")
            
            with open(file_path, 'rb') as file:
                files = {'text': file}
                
                response = requests.post(
                    self.base_url,
                    files=files,
                    headers=self.headers,
                    timeout=60
                )
                
                response.raise_for_status()
                result = response.json()
                
                print(f"✅ ConvoArt: Image generated from file successfully!")
                print(f"🔗 Image URL: {result.get('output_url', 'N/A')}")
                
                # Save image if path provided
                if save_path and result.get('output_url'):
                    self._save_image(result['output_url'], save_path)
                
                return result
                
        except requests.RequestException as e:
            error_msg = f"❌ ConvoArt API Error: {str(e)}"
            print(error_msg)
            return {'error': error_msg, 'status': 'failed'}
        except Exception as e:
            error_msg = f"❌ ConvoArt Error: {str(e)}"
            print(error_msg)
            return {'error': error_msg, 'status': 'failed'}
    
    def _save_image(self, image_url: str, save_path: str) -> bool:
        """
        Download and save image from URL.
        
        Args:
            image_url: URL of the generated image
            save_path: Path where to save the image
            
        Returns:
            True if successful, False otherwise
        """
        try:
            print(f"💾 ConvoArt: Downloading image to: {save_path}")
            
            response = requests.get(image_url, timeout=30)
            response.raise_for_status()
            
            # Create directory if it doesn't exist
            Path(save_path).parent.mkdir(parents=True, exist_ok=True)
            
            with open(save_path, 'wb') as file:
                file.write(response.content)
            
            print(f"✅ ConvoArt: Image saved successfully to: {save_path}")
            return True
            
        except Exception as e:
            print(f"❌ ConvoArt: Failed to save image: {str(e)}")
            return False

def main():
    """
    Example usage of the ConvoArt class.
    """
    # Example usage - you can replace with your actual API key
    API_KEY = "9475df54-f35e-4f20-ae0c-95e99c6c54f3"  # Your DeepAI API key
    
    try:
        # Initialize ConvoArt
        convoart = ConvoArt(api_key=API_KEY)
        
        # Example 1: Generate from text prompt
        print("=" * 60)
        print("🎨 ConvoArt Python Integration Example")
        print("=" * 60)
        
        prompt = "A beautiful sunset over a mountain landscape with vibrant colors"
        result = convoart.generate_from_text(
            prompt=prompt,
            save_path="generated_image.jpg"
        )
        
        if 'error' not in result:
            print(f"\n📊 Generation Details:")
            print(f"   • Prompt: {prompt}")
            print(f"   • Image URL: {result.get('output_url', 'N/A')}")
            print(f"   • Status: Success")
        
        # Example 2: Generate from file (uncomment to test)
        # print("\n" + "=" * 60)
        # print("📄 Generating from file...")
        # 
        # # Create a sample text file
        # with open('sample_prompt.txt', 'w') as f:
        #     f.write("A futuristic city with flying cars and neon lights")
        # 
        # result2 = convoart.generate_from_file(
        #     file_path="sample_prompt.txt",
        #     save_path="generated_from_file.jpg"
        # )
        
        print("\n" + "=" * 60)
        print("✨ ConvoArt integration complete!")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print("\n💡 Quick Setup:")
        print("   1. Get your API key from: https://deepai.org/api")
        print("   2. Replace YOUR_DEEPAI_API_KEY_HERE with your actual key")
        print("   3. Or set environment variable: export DEEPAI_API_KEY='your_key'")

if __name__ == "__main__":
    main() 