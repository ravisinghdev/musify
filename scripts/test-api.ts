import { app } from "../apps/api/src/index";

async function runTests() {
  console.log("==========================================");
  console.log("   MUSIFY AUTONOMOUS VERIFICATION SUITE   ");
  console.log("==========================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failed++;
    }
  }

  // TEST 1: API Health Endpoint
  console.log("--- 1. Testing Backend Health & Base Endpoints ---");
  try {
    const res = await app.handle(new Request("http://localhost/api/health"));
    const data = await res.json();
    assert(res.status === 200, "Health status is 200 OK");
    assert(data.status === "ok", "Health response body has status 'ok'");
    assert(data.service === "musify-api", "Service identifies as 'musify-api'");
  } catch (err) {
    assert(false, `Health endpoint failed: ${err}`);
  }

  // TEST 2: API v1 Index
  try {
    const res = await app.handle(new Request("http://localhost/api/v1"));
    const data = await res.json();
    assert(res.status === 200, "/api/v1 index returns 200");
    assert(Array.isArray(data.endpoints), "Endpoints list is returned");
  } catch (err) {
    assert(false, `/api/v1 index failed: ${err}`);
  }

  // TEST 3: Search Query
  console.log("\n--- 2. Testing Search Functionality ---");
  try {
    const res = await app.handle(new Request("http://localhost/api/v1/search?q=Arijit%20Singh&type=song"));
    assert(res.status === 200, "Search query returns 200");
    const data = await res.json();
    assert(Array.isArray(data.tracks), "Search returns tracks array");
    assert(data.tracks.length > 0, `Search found ${data.tracks?.length || 0} tracks`);
    if (data.tracks?.length > 0) {
      const first = data.tracks[0];
      assert(Boolean(first.id && first.title), `Track has id (${first.id}) and title (${first.title})`);
      assert(Array.isArray(first.artists), "Track has artists array");
    }
  } catch (err) {
    assert(false, `Search failed: ${err}`);
  }

  // TEST 4: Recommendations
  console.log("\n--- 3. Testing Recommendations ---");
  try {
    const res = await app.handle(new Request("http://localhost/api/v1/search/recommendations"));
    assert(res.status === 200, "Recommendations returns 200");
    const data = await res.json();
    assert(Array.isArray(data.tracks), "Recommendations returns tracks array");
    assert(data.tracks.length > 0, `Recommendations returned ${data.tracks?.length || 0} tracks`);
  } catch (err) {
    assert(false, `Recommendations failed: ${err}`);
  }

  // TEST 5: Suggestions
  console.log("\n--- 4. Testing Suggestions ---");
  try {
    const res = await app.handle(new Request("http://localhost/api/v1/search/suggestions?q=Coldplay"));
    assert(res.status === 200, "Suggestions returns 200");
    const data = await res.json();
    assert(Array.isArray(data.suggestions), "Suggestions array returned");
  } catch (err) {
    assert(false, `Suggestions failed: ${err}`);
  }

  console.log("\n==========================================");
  console.log(`SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("==========================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
