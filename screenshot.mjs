import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'

const url = process.argv[2] || 'http://localhost:3000'
const label = process.argv[3] || ''

const screenshotsDir = path.join(process.cwd(), 'temporary screenshots')
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true })

const existing = fs.readdirSync(screenshotsDir).filter(f => f.endsWith('.png')).length
const filename = `screenshot-${existing + 1}${label ? '-' + label : ''}.png`
const outPath = path.join(screenshotsDir, filename)

const browser = await puppeteer.launch({
  executablePath: 'C:/Users/kosta/.cache/puppeteer/chrome/win64-146.0.7680.153/chrome-win64/chrome.exe',
  args: ['--no-sandbox'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 })
await page.screenshot({ path: outPath, fullPage: true })
await browser.close()

console.log(`Saved: ${outPath}`)
