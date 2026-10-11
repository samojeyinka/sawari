import puppeteer from 'puppeteer-core'

const CHROME = String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const main = async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  })
  const page = await browser.newPage()
  await page.goto('http://localhost:4173/__toggle_check.html', { waitUntil: 'networkidle0' })
  await sleep(400)

  const data = await page.$eval('#on', (btn) => {
    const track = btn.getBoundingClientRect()
    const knob = btn.querySelector('span').getBoundingClientRect()
    return {
      trackLeft: track.left,
      trackRight: track.right,
      trackWidth: track.width,
      knobLeft: knob.left,
      knobRight: knob.right,
      knobWidth: knob.width,
      knobBg: getComputedStyle(btn.querySelector('span')).backgroundColor,
    }
  })
  const leftOffset = data.knobLeft - data.trackLeft
  const rightGap = data.trackRight - data.knobRight
  console.log(JSON.stringify({ ...data, leftOffset, rightGap }, null, 2))

  const okLeft = Math.abs(leftOffset - 2) <= 1.5
  const inside = rightGap >= -0.5 && data.knobRight <= data.trackRight + 0.5
  console.log(`knob left offset ~2px (px-0.5): ${okLeft ? 'PASS' : 'FAIL'} (${leftOffset.toFixed(2)}px)`)
  console.log(`knob right edge inside 44px track: ${inside ? 'PASS' : 'FAIL'} (gap ${rightGap.toFixed(2)}px)`)
  process.exitCode = okLeft && inside ? 0 : 1
  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
