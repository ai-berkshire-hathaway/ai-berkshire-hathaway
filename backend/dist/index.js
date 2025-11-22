"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./api/server");
const dcaCron_1 = require("./jobs/dcaCron");
const dcaEvents_1 = require("./listeners/dcaEvents");
async function main() {
    await (0, server_1.startApiServer)();
    await (0, dcaCron_1.startDcaCron)();
    await (0, dcaEvents_1.startDcaEventListener)();
}
main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
