# Favicon Setup Instructions

## Creating the Favicon

The HTML has been updated to reference `/public/favicon.png`, but you need to create this file from your dog image.

### Steps:

1. **Locate your dog image** (the dalmatian head from the screenshot you showed)

2. **Create a 512x512 PNG** of just the dog's head (crop it from your image)

3. **Save it to** `/Users/jamiefletcher/Documents/Claude Projects/CoachDog/Coachverify/public/favicon.png`

### Using macOS Preview (easiest):
1. Open your dog image in Preview
2. Use the selection tool to select just the dog's head
3. Cmd+K to crop to selection
4. Tools → Adjust Size → Set width to 512 pixels (keep aspect ratio locked)
5. Export as PNG → Save as `favicon.png` in the `/public` folder

### Or use command line (if you have a cropped version):
```bash
cd "/Users/jamiefletcher/Documents/Claude Projects/CoachDog/Coachverify/public"
sips -Z 512 your-dog-image.png --out favicon.png
```

### Optimal Sizes:
- Main favicon: 512x512px (will be auto-scaled by browsers)
- This single file works for both desktop and mobile

## What's Already Done:
✅ HTML updated to reference `/favicon.png`
✅ Added both regular and Apple touch icon support
✅ Build tested and working

## What You Need To Do:
❌ Create and save the `favicon.png` file in `/public/`

After adding the file, rebuild with `npm run build` to include it in the dist folder.
