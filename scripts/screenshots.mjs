import { chromium } from "playwright"

const BASE = process.env.BASE_URL || "http://localhost:3000"
const API = process.env.API_URL || "http://127.0.0.1:8080"
const OUT = process.env.OUT_DIR || "screenshots"

async function main() {
  const res = await fetch(`${API}/api/v1/devices`)
  const { data: devices } = await res.json()
  const device = devices.find((d) => d.status === "device")
  if (!device) {
    console.error("No connected device found")
    process.exit(1)
  }
  const deviceId = encodeURIComponent(device.id)
  console.log(`Device: ${device.id} (${device.market_name ?? device.model})`)

  const pages = [
    { path: "/", name: "dashboard", wait: ".grid" },
    { path: "/devices", name: "devices", wait: "table" },
    { path: `/devices/${deviceId}`, name: "overview" },
    { path: `/devices/${deviceId}/system`, name: "system" },
    { path: `/devices/${deviceId}/storage`, name: "storage" },
    { path: `/devices/${deviceId}/battery`, name: "battery" },
    { path: `/devices/${deviceId}/network`, name: "network" },
    { path: `/devices/${deviceId}/apps`, name: "apps" },
    { path: `/devices/${deviceId}/report`, name: "report", click: "Generate Full Report" },
    { path: "/shell", name: "shell", wait: "h1" },
    { path: "/reports", name: "reports", wait: "h1" },
    { path: "/settings", name: "settings", wait: "h1" },
  ]

  const browser = await chromium.launch({
    headless: true,
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox", "--disable-gpu"],
  })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  })

  for (const { path, name, wait, click } of pages) {
    const page = await context.newPage()
    try {
      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 30000 })

      if (wait) {
        await page.waitForSelector(wait, { timeout: 10000 })
      }

      if (click) {
        await page.getByRole("button", { name: click }).click()
        await page.waitForTimeout(3000) // wait for report generation
      }

      // Wait for loading/error texts to disappear (data loaded)
      for (const text of ["Loading...", "Error"]) {
        await page.waitForFunction(
          (t) => !document.body?.innerText?.includes(t),
          text,
          { timeout: 15000 }
        ).catch(() => {})
      }

      // Extra settle time for CSS animations
      await page.waitForTimeout(2000)

      await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
      console.log(`✓ ${name}`)
    } catch (e) {
      console.error(`✗ ${name}: ${e.message}`)
    } finally {
      await page.close()
    }
  }

  await browser.close()
  console.log("\nDone")
}

main().catch(console.error)
