const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

async function expectOk(path, expectedText) {
  const response = await fetch(new URL(path, frontendUrl));
  const body = await response.text();

  if (!response.ok || !body.includes(expectedText)) {
    throw new Error(`Smoke test failed for ${path}: ${response.status} ${body}`);
  }
}

await expectOk("/", "E-commerce");
await expectOk("/api", "Hello World!");

console.log("Frontend and API proxy smoke test passed.");
