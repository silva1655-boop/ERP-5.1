import sharp from 'sharp'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const icon     = readFileSync(resolve(root, 'public/icons/icon.svg'))
const maskable = readFileSync(resolve(root, 'public/icons/icon-maskable.svg'))

const sizes = [192, 512]

for (const size of sizes) {
  await sharp(icon).resize(size, size).png().toFile(resolve(root, `public/icons/icon-${size}.png`))
  console.log(`✓ icon-${size}.png`)
}

await sharp(maskable).resize(512, 512).png().toFile(resolve(root, 'public/icons/icon-maskable-512.png'))
console.log('✓ icon-maskable-512.png')

console.log('Icons generated successfully.')
