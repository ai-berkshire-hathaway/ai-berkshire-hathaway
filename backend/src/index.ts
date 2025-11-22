import { startApiServer } from "./api/server";
import { startDcaCron } from "./jobs/dcaCron";
import { startDcaEventListener } from "./listeners/dcaEvents";

async function main() {
  await startApiServer();
  await startDcaCron();
  await startDcaEventListener();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});