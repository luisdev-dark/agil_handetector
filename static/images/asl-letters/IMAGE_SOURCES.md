# ASL Letter Image Sources

This document provides links and resources for obtaining high-quality ASL alphabet reference images.

## Recommended Free Sources

### 1. Wikimedia Commons
- **URL**: https://commons.wikimedia.org/wiki/Category:American_Sign_Language_alphabet
- **License**: Public Domain / Creative Commons
- **Quality**: High-quality, professional images
- **Format**: Various (PNG, JPG, SVG)

### 2. National Association of the Deaf (NAD)
- **URL**: https://www.nad.org/
- **Note**: Check their resources section for educational materials
- **License**: May require attribution

### 3. Gallaudet University Resources
- **URL**: https://www.gallaudet.edu/
- **Note**: Educational institution with ASL resources
- **License**: Check individual resource licenses

### 4. ASL University
- **URL**: https://www.lifeprint.com/
- **Note**: Free ASL learning resources
- **License**: Educational use

### 5. HandSpeak
- **URL**: https://www.handspeak.com/word/
- **Note**: ASL dictionary with images
- **License**: Check terms of use

## Image Search Tips

### Google Images
Search terms:
- "ASL alphabet letter [A-X]"
- "American Sign Language alphabet"
- "ASL fingerspelling chart"

Filters:
- Usage rights: "Creative Commons licenses" or "Public domain"
- Size: Large (for better quality)
- Type: Photos

### Specific Letter Searches
For each letter, search:
- "ASL letter A hand sign"
- "American Sign Language letter A"
- "ASL fingerspelling A"

## Creating Your Own Images

### Photography Setup
1. **Lighting**: Use natural light or soft box lighting
2. **Background**: Solid color (white, gray, or light blue)
3. **Camera**: Smartphone camera (12MP+) or DSLR
4. **Distance**: 2-3 feet from subject
5. **Angle**: Straight-on view of hand

### Hand Model Guidelines
- Clean, well-groomed hands
- Neutral skin tone lighting
- Clear finger positioning
- Consistent hand orientation across all letters

### Photo Editing
1. Crop to square (1:1 aspect ratio)
2. Adjust brightness/contrast for clarity
3. Remove background if needed
4. Resize to 400x400 pixels
5. Optimize file size (< 100KB)

## Batch Download Tools

### For Wikimedia Commons
Use the Wikimedia Commons API or tools like:
- **Pywikibot**: Python library for downloading
- **Commons Mass Downloader**: Browser extension

### Example Python Script
```python
import requests
from PIL import Image
from io import BytesIO

def download_asl_image(letter, url, output_path):
    response = requests.get(url)
    img = Image.open(BytesIO(response.content))
    img = img.resize((400, 400), Image.LANCZOS)
    img.save(output_path, 'WEBP', quality=85)
    print(f"Downloaded: {letter}")

# Example usage
# download_asl_image('A', 'https://example.com/asl-a.jpg', 'A.webp')
```

## Image Optimization

### Online Tools
1. **Squoosh**: https://squoosh.app/
   - Drag and drop images
   - Convert to WebP
   - Adjust quality slider

2. **TinyPNG**: https://tinypng.com/
   - Compress PNG/JPG
   - Batch processing

3. **CloudConvert**: https://cloudconvert.com/
   - Convert between formats
   - Batch conversion

### Command Line Tools

#### ImageMagick
```bash
# Convert and resize
convert input.jpg -resize 400x400 -quality 85 output.webp

# Batch convert all JPG to WebP
for file in *.jpg; do
    convert "$file" -resize 400x400 -quality 85 "${file%.jpg}.webp"
done
```

#### cwebp (WebP encoder)
```bash
# Single file
cwebp -q 85 -resize 400 400 input.jpg -o output.webp

# Batch convert
for file in *.jpg; do
    cwebp -q 85 -resize 400 400 "$file" -o "${file%.jpg}.webp"
done
```

## License Compliance

### Attribution Template
If images require attribution, add to `ATTRIBUTIONS.txt`:

```
Letter A:
- Source: [Source Name]
- Author: [Author Name]
- License: [License Type]
- URL: [Original URL]
- Modifications: Resized to 400x400, converted to WebP
```

### Creative Commons Licenses
- **CC0**: Public domain, no attribution required
- **CC BY**: Attribution required
- **CC BY-SA**: Attribution + Share Alike
- **CC BY-ND**: Attribution + No Derivatives

## Quality Checklist

Before adding an image, verify:
- [ ] Hand position is clearly visible
- [ ] Image is well-lit and in focus
- [ ] Background is clean/simple
- [ ] File size is optimized (< 100KB)
- [ ] Format is WebP (preferred) or PNG
- [ ] Dimensions are 400x400 pixels
- [ ] License allows usage
- [ ] Attribution is documented (if required)

## Quick Start Guide

1. **Download images** from Wikimedia Commons or other sources
2. **Rename files** to match letter (A.jpg, B.jpg, etc.)
3. **Optimize images** using Squoosh or ImageMagick
4. **Convert to WebP** for best compression
5. **Place in** `static/images/asl-letters/` directory
6. **Test** by opening the guide at `/guide`

## Fallback Behavior

The guide.html is designed to gracefully handle missing images:
- Shows large letter placeholder if image not found
- Displays "Imagen de referencia próximamente" badge
- Automatically loads image when file is added
- Tries multiple formats (webp, png, jpg, jpeg)

## Need Help?

If you need assistance:
1. Check the README.md in this directory
2. Review the generate_placeholders.py script
3. Test with placeholder images first
4. Verify file naming matches exactly (case-sensitive)
