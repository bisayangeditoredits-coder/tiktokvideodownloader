const fs = require('fs');
const path = require('path');

// 1x1 transparent PNG base64
const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const pngBuffer = Buffer.from(pngBase64, 'base64');

// 1x1 WebP
const webpBase64 = "UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==";
const webpBuffer = Buffer.from(webpBase64, 'base64');

const frontendDir = path.join(__dirname, 'frontend');
const iconsDir = path.join(frontendDir, 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
sizes.forEach(size => {
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), pngBuffer);
});

fs.writeFileSync(path.join(frontendDir, 'og-image.webp'), webpBuffer);
fs.writeFileSync(path.join(frontendDir, 'screenshot-mobile.webp'), webpBuffer);
fs.writeFileSync(path.join(frontendDir, 'remove-tiktok-watermark-step-1.webp'), webpBuffer);
fs.writeFileSync(path.join(frontendDir, 'remove-tiktok-watermark-step-2.webp'), webpBuffer);
fs.writeFileSync(path.join(frontendDir, 'remove-tiktok-watermark-step-3.webp'), webpBuffer);
fs.writeFileSync(path.join(frontendDir, 'remove-tiktok-watermark-step-4.webp'), webpBuffer);
fs.writeFileSync(path.join(frontendDir, 'remove-tiktok-watermark-step-5.webp'), webpBuffer);

console.log('Dummy images created successfully.');
