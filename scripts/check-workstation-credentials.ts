const hasBwsToken = Boolean(process.env.BWS_ACCESS_TOKEN?.trim());

process.stdout.write(`BWS_ACCESS_TOKEN: ${hasBwsToken ? "present" : "missing"}\n`);
if (!hasBwsToken) process.exitCode = 1;
