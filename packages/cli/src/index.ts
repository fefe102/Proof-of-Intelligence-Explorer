#!/usr/bin/env node

import { Command } from "commander";

const program = new Command();

program.name("poi").description("Proof-of-Intelligence Explorer CLI").version("0.1.0");

program.command("health").action(() => {
  console.log(JSON.stringify({ ok: true, service: "poi-cli" }, null, 2));
});

program.parse();
