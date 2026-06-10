import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = "/Users/liuhongzhe/Documents/专业建设/major-construction-platform";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT_DIR = join(ROOT, "outputs/prd/current-demo-screenshots");
const USER_DATA_DIR = join("/tmp", `codex-current-demo-${Date.now()}`);
const PORT = 9333 + Math.floor(Math.random() * 400);
const BASE_URL = `file://${ROOT}/index.html`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

async function waitForDebugger() {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      return await fetchJson(`http://127.0.0.1:${PORT}/json/version`);
    } catch {
      await sleep(250);
    }
  }
  throw new Error("Chrome DevTools endpoint did not become ready.");
}

async function getPageDebuggerUrl() {
  try {
    const created = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" });
    if (created.ok) {
      const page = await created.json();
      if (page.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    }
  } catch {
    // Fall back to the first existing page target below.
  }
  const targets = await fetchJson(`http://127.0.0.1:${PORT}/json`);
  const page = targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
  if (!page) throw new Error("No Chrome page target was available.");
  return page.webSocketDebuggerUrl;
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const events = new Map();

  ws.addEventListener("message", (message) => {
    const payload = JSON.parse(message.data);
    if (payload.id && pending.has(payload.id)) {
      const { resolve, reject } = pending.get(payload.id);
      pending.delete(payload.id);
      if (payload.error) reject(new Error(payload.error.message || JSON.stringify(payload.error)));
      else resolve(payload.result || {});
      return;
    }
    const listeners = events.get(payload.method) || [];
    listeners.forEach((listener) => listener(payload.params || {}));
  });

  const opened = new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  return {
    opened,
    send(method, params = {}) {
      const requestId = ++id;
      ws.send(JSON.stringify({ id: requestId, method, params }));
      return new Promise((resolve, reject) => pending.set(requestId, { resolve, reject }));
    },
    once(method) {
      return new Promise((resolve) => {
        const listener = (params) => {
          const listeners = events.get(method) || [];
          events.set(method, listeners.filter((item) => item !== listener));
          resolve(params);
        };
        events.set(method, [...(events.get(method) || []), listener]);
      });
    },
    close() {
      ws.close();
    },
  };
}

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const chrome = spawn(CHROME, [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    "--window-size=1920,1080",
    "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe"] });

  const errors = [];
  chrome.stderr.on("data", (chunk) => errors.push(chunk.toString()));

  let cdp;
  try {
    await waitForDebugger();
    cdp = connect(await getPageDebuggerUrl());
    await cdp.opened;
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const navigate = async (query = "") => {
      const loaded = cdp.once("Page.loadEventFired");
      await cdp.send("Page.navigate", { url: `${BASE_URL}${query}` });
      await loaded;
      await sleep(900);
      await cdp.send("Runtime.evaluate", { expression: "window.scrollTo(0, 0)" });
    };

    const evaluate = async (expression, wait = 350) => {
      await cdp.send("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
      await sleep(wait);
    };

    const shot = async (name) => {
      await sleep(200);
      const result = await cdp.send("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
        captureBeyondViewport: false,
      });
      await writeFile(join(OUT_DIR, name), Buffer.from(result.data, "base64"));
      console.log(name);
    };

    await navigate("?view=job-industry&tab=chain");
    await shot("01-industry-chain.png");
    await navigate("?view=job-industry&tab=region");
    await shot("02-industry-region.png");
    await navigate("?view=job-industry&tab=policy");
    await shot("03-industry-policy.png");
    await navigate("?view=job-industry&tab=company");
    await shot("04-industry-company.png");

    await navigate("?view=job-research&tab=portrait");
    await shot("05-job-portrait.png");
    await evaluate("document.querySelector('[data-static-portrait-job]')?.click()", 500);
    await shot("06-job-portrait-detail.png");
    await navigate("?view=job-research&tab=demand");
    await shot("07-job-demand.png");
    await navigate("?view=job-research&tab=forecast");
    await shot("08-job-forecast.png");
    await navigate("?view=job-competency-map&job=job-bim-modeler");
    await shot("09-job-competency-map.png");

    await navigate("");
    await shot("10-build-empty.png");
    await evaluate("document.querySelector('[data-open-add-dialog]')?.click()", 500);
    await shot("11-build-add-job-dialog.png");
    await evaluate(`
      Array.from(document.querySelectorAll('[data-candidate-id]:not([disabled])')).slice(0, 8).forEach((item) => item.click());
      document.querySelector('[data-confirm-add]')?.click();
    `, 900);
    await shot("12-build-after-add.png");
    await evaluate("document.querySelector('[data-open-detail]')?.click()", 700);
    await shot("13-job-detail-basic.png");
    await evaluate("document.querySelector('[data-open-course-dialog]')?.click()", 500);
    await shot("14-job-detail-edu-course-dialog.png");
    await evaluate("document.querySelector('[data-close-static-dialog], [data-close-add-dialog], .dialog-close')?.click()", 300);
    await evaluate("document.querySelector('[data-tab=\"tasks\"]')?.click()", 500);
    await shot("15-job-detail-tasks.png");
    await evaluate("document.querySelector('[data-tab=\"abilities\"]')?.click()", 500);
    await shot("16-job-detail-abilities.png");
    await evaluate("document.querySelector('[data-open-ability-import]')?.click()", 500);
    await shot("17-job-detail-ability-import.png");
    await evaluate("document.querySelector('[data-close-static-dialog], [data-close-add-dialog], .dialog-close')?.click()", 300);
    await evaluate("document.querySelector('[data-tab=\"map\"]')?.click()", 700);
    await shot("18-job-detail-ability-map.png");

    await navigate("?view=course-model");
    await shot("19-course-model.png");
    await evaluate(`
      document.querySelector('[data-course-edit-toggle]')?.click();
      document.querySelector('[data-course-node]')?.click();
    `, 450);
    await evaluate("document.querySelector('[data-course-node-detail]')?.click()", 600);
    await evaluate(`
      Array.from(document.querySelectorAll('[data-course-detail-tab]')).find((item) => item.textContent.trim() === '岗位能力')?.click();
    `, 400);
    await evaluate("document.querySelector('[data-open-course-ability-dialog]')?.click()", 700);
    await shot("20-course-ai-ability-dialog.png");

    await navigate("?view=results-portal");
    await shot("21-results-portal.png");
  } finally {
    cdp?.close();
    chrome.kill("SIGTERM");
    await sleep(500);
    try {
      await rm(USER_DATA_DIR, { recursive: true, force: true });
    } catch {
      // Chrome may still be releasing its profile files; screenshots are already written.
    }
    if (errors.length) {
      const usefulErrors = errors.join("").split("\n").filter((line) => line && !line.includes("ssl_client_socket_impl")).slice(0, 5);
      if (usefulErrors.length) console.error(usefulErrors.join("\n"));
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
