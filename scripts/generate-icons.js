// Simple icon generation script for PWA
// This creates placeholder icons - replace with your actual logo

const fs = require('fs');
const path = require('path');

// Icon sizes needed for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create a simple SVG icon
const createSVGIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#0ea5e9" rx="${size * 0.2}"/>
  <text x="50%" y="50%" text-anchor="middle" dy="0.35em" font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold" fill="white">MS</text>
</svg>`;

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons
iconSizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`Created ${filename}`);
});

// Also create PNG versions (you'll need to convert these manually or use a tool)
console.log('\n📝 Note: SVG icons created. For PNG versions:');
console.log('1. Use an online converter like https://convertio.co/svg-png/');
console.log('2. Or use RealFaviconGenerator: https://realfavicongenerator.net/');
console.log('3. Upload your actual logo and generate all sizes');

console.log('\n✅ PWA icons setup complete!');
