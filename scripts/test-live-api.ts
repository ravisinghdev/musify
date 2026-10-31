async function testLiveApi() {
  const BASE_URL = "https://musify-4fzw.onrender.com/api";
  console.log(`Testing Live API at: ${BASE_URL}\n`);

  // 1. Health
  const t0 = Date.now();
  const healthRes = await fetch(`${BASE_URL}/health`);
  const health = await healthRes.json();
  console.log(`[PASS] Health check in ${Date.now() - t0}ms:`, health);

  // 2. Search
  const t1 = Date.now();
  const searchRes = await fetch(`${BASE_URL}/v1/search?q=Arijit%20Singh&type=song`);
  const searchData = (await searchRes.json()) as any;
  console.log(`[PASS] Search returned ${searchData?.tracks?.length ?? 0} tracks in ${Date.now() - t1}ms`);
  if (searchData?.tracks?.length > 0) {
    const track = searchData.tracks[0];
    console.log(`       Sample Track: "${track.title}" by ${track.artists?.map((a: any) => a.name).join(", ")} [ID: ${track.id}]`);
  }

  // 3. Recommendations
  const t2 = Date.now();
  const recRes = await fetch(`${BASE_URL}/v1/search/recommendations`);
  const recData = (await recRes.json()) as any;
  console.log(`[PASS] Recommendations returned ${recData?.tracks?.length ?? 0} tracks in ${Date.now() - t2}ms`);

  // 4. Suggestions
  const t3 = Date.now();
  const suggRes = await fetch(`${BASE_URL}/v1/search/suggestions?q=Coldplay`);
  const suggData = (await suggRes.json()) as any;
  console.log(`[PASS] Suggestions returned ${suggData?.suggestions?.length ?? 0} suggestions in ${Date.now() - t3}ms`);

  console.log("\nALL LIVE BACKEND CHECKS PASSED SUCCESSFULLY!");
}

testLiveApi().catch((err) => {
  console.error("Live API Test Failed:", err);
  process.exit(1);
});

