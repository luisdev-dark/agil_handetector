# ASL Letters Reference Images

This directory contains reference images for the 24 letters of the American Sign Language (ASL) alphabet.

## Image Requirements

### File Naming Convention
Images should be named using the following pattern:
- `{letter}.webp` (e.g., `A.webp`, `B.webp`, etc.)
- Use uppercase letters for consistency

### Image Specifications
- **Format**: WebP (preferred for web optimization) or PNG/JPG
- **Dimensions**: 400x400 pixels (recommended)
- **Aspect Ratio**: 1:1 (square)
- **File Size**: < 100KB per image (optimized)
- **Background**: Clean, solid color or transparent
- **Quality**: High resolution, clear hand positioning

### Content Guidelines
- Show clear, well-lit hand sign
- Hand should be centered in frame
- Fingers and thumb positions must be clearly visible
- Use consistent lighting across all images
- Professional or high-quality photography preferred

## Image Sources

### Free Resources
1. **Public Domain Sources**:
   - Wikimedia Commons (search "ASL alphabet")
   - National Association of the Deaf resources
   - Public domain ASL educational materials

2. **Creative Commons Licensed**:
   - Ensure proper attribution if required
   - Verify commercial use is allowed

3. **Custom Photography**:
   - Take your own photos following the guidelines above
   - Ensure good lighting and clear hand positioning

## Image Optimization

### Converting to WebP
Use online tools or command-line utilities to convert images to WebP format:

```bash
# Using cwebp (WebP encoder)
cwebp -q 80 input.jpg -o A.webp

# Using ImageMagick
convert input.jpg -quality 80 A.webp
```

### Batch Optimization
For multiple images, you can use tools like:
- **Squoosh** (web-based): https://squoosh.app/
- **ImageOptim** (Mac)
- **FileOptimizer** (Windows)

## Letter List

The following 24 letters need reference images:

- [ ] A.webp
- [ ] B.webp
- [ ] C.webp
- [ ] D.webp
- [ ] E.webp
- [ ] F.webp
- [ ] G.webp
- [ ] H.webp
- [ ] I.webp
- [ ] J.webp (note: this letter involves movement)
- [ ] K.webp
- [ ] L.webp
- [ ] M.webp
- [ ] N.webp
- [ ] O.webp
- [ ] P.webp
- [ ] Q.webp
- [ ] R.webp
- [ ] S.webp
- [ ] T.webp
- [ ] U.webp
- [ ] V.webp
- [ ] W.webp
- [ ] X.webp

## Integration with Guide

Once images are added to this directory, update the `guide.html` file to load them:

```javascript
// In guide.html, update the showDetailView function
const imagePath = `/static/images/asl-letters/${letter.letter}.webp`;
const imgElement = document.getElementById('detailImage');
const placeholder = document.getElementById('detailImagePlaceholder');

// Try to load the image
imgElement.src = imagePath;
imgElement.onload = function() {
    placeholder.style.display = 'none';
    imgElement.style.display = 'block';
};
imgElement.onerror = function() {
    // Image not found, keep placeholder
    placeholder.style.display = 'flex';
    imgElement.style.display = 'none';
};
```

## Copyright and Attribution

- Ensure all images are properly licensed for use
- Add attribution in comments if required by license
- Keep a record of image sources for reference

## Notes

- The guide currently displays letter placeholders (large letters) when images are not available
- Images will automatically display once added to this directory with correct naming
- The "Imagen de referencia próximamente" badge will remain until images are loaded
