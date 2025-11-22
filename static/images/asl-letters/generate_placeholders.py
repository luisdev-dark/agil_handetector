"""
Generate placeholder images for ASL letters
This script creates simple placeholder images for each letter of the ASL alphabet.
These can be replaced with actual ASL hand sign photos later.

Requirements:
    pip install Pillow

Usage:
    python generate_placeholders.py
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os
except ImportError:
    print("Error: Pillow library not installed")
    print("Install it with: pip install Pillow")
    exit(1)


def generate_placeholder_image(letter, size=(400, 400), output_dir="."):
    """
    Generate a placeholder image for a given letter
    
    Args:
        letter: The letter to generate (A-X, excluding J, Y, Z)
        size: Tuple of (width, height) for the image
        output_dir: Directory to save the image
    """
    # Create image with gradient background
    img = Image.new('RGB', size, color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw gradient background
    for i in range(size[1]):
        # Purple gradient
        r = int(102 + (118 - 102) * i / size[1])
        g = int(126 + (75 - 126) * i / size[1])
        b = int(234 + (162 - 234) * i / size[1])
        draw.rectangle([(0, i), (size[0], i+1)], fill=(r, g, b))
    
    # Try to use a nice font, fall back to default if not available
    try:
        font = ImageFont.truetype("arial.ttf", 200)
    except:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 200)
        except:
            font = ImageFont.load_default()
    
    # Draw letter in center
    text = letter
    
    # Get text bounding box for centering
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    position = ((size[0] - text_width) // 2, (size[1] - text_height) // 2 - 20)
    
    # Draw text with shadow
    shadow_offset = 4
    draw.text((position[0] + shadow_offset, position[1] + shadow_offset), 
              text, font=font, fill=(0, 0, 0, 128))
    draw.text(position, text, font=font, fill='white')
    
    # Add "Placeholder" text at bottom
    try:
        small_font = ImageFont.truetype("arial.ttf", 24)
    except:
        try:
            small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
        except:
            small_font = font
    
    placeholder_text = "Placeholder - Add real ASL image"
    bbox = draw.textbbox((0, 0), placeholder_text, font=small_font)
    text_width = bbox[2] - bbox[0]
    
    draw.text(((size[0] - text_width) // 2, size[1] - 50), 
              placeholder_text, font=small_font, fill='white')
    
    # Save image
    output_path = os.path.join(output_dir, f"{letter}.png")
    img.save(output_path, 'PNG', optimize=True)
    print(f"Generated: {output_path}")
    
    return output_path


def main():
    """Generate placeholder images for all ASL letters"""
    # ASL alphabet (24 letters, excluding J which requires motion, and Y, Z)
    letters = [
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
        'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X'
    ]
    
    # Get current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    print(f"Generating placeholder images in: {current_dir}")
    print(f"Total letters: {len(letters)}")
    print("-" * 50)
    
    for letter in letters:
        try:
            generate_placeholder_image(letter, output_dir=current_dir)
        except Exception as e:
            print(f"Error generating {letter}: {e}")
    
    print("-" * 50)
    print(f"Done! Generated {len(letters)} placeholder images")
    print("\nNote: These are placeholder images. Replace them with actual ASL hand sign photos.")
    print("Recommended: Use WebP format for better compression (convert PNG to WebP)")


if __name__ == "__main__":
    main()
