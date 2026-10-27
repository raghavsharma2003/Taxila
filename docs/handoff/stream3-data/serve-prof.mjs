process.on("SIGTERM", () => process.exit(0));
await import("/home/user/Taxila/server/serve.mjs");
