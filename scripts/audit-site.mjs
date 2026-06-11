#!/usr/bin/env node

import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const root = resolve(process.argv[2] || ".");
const htmlPath = join(root, "index.html");

if (!existsSync(htmlPath)) {
  console.error("FAIL: index.html is missing");
  process.exit(1);
}

const html = readFileSync(htmlPath, "utf8");
const checks = [
  ["one H1", (html.match(/<h1\b/gi) || []).length === 1],
  ["meta description", /name="description"/i.test(html)],
  ["ROI calculator", /id="roi-calculator"/i.test(html)],
  ["VSL", /<video\b/i.test(html)],
  ["free trial", /30-day free trial/i.test(html)],
  ["pricing", /\$299/i.test(html)],
  ["estimate disclaimer", /Estimate only\./i.test(html)],
  ["free SOP", /download="GHL-AI-Phone-System-Master-SOP\.pdf"/i.test(html)],
  ["privacy link", /href="privacy\.html"/i.test(html)],
  ["video asset", existsSync(join(root, "assets/paula-vsl.mp4"))],
  ["SOP asset", existsSync(join(root, "downloads/ghl-ai-phone-system-master-sop.pdf"))],
];

let failures = 0;
for (const [name, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"}: ${name}`);
  if (!passed) failures += 1;
}

if (failures) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}

console.log("\nSite audit passed.");
