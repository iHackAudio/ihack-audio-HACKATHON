import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const currentDir = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

import * as p1 from "../Instructions/protocol1";
import * as p5 from "../Instructions/protocol5";
import * as cinematic3Agent from "../Instructions/cinematic_3agent_story";
import * as cinematicSimple from "../Instructions/cinematic_simple";
import * as autogen from "../Instructions/autogen";
import * as adkStory from "../Instructions/adk_story";

const CONFIG_FILE = path.join(process.cwd(), "server", "protocols", "activeProtocol.json");

function loadConfig(): { activeProtocol: string } {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("Failed to load protocol config:", err);
  }
  return { activeProtocol: "autogen" };
}

export function getActiveProtocol(): string {
  return loadConfig().activeProtocol;
}

export function listProtocols() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8")).protocols;
    }
  } catch (err) {
    console.error("Failed to list protocols:", err);
  }
  return {};
}

export function setActiveProtocol(protocolId: string): boolean {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
       return false;
    }
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    if (!config.protocols[protocolId]) {
      console.error(`Protocol ${protocolId} not found.`);
      return false;
    }
    config.activeProtocol = protocolId;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
    console.log(`[Protocol] Switched to: ${protocolId} (${config.protocols[protocolId].name})`);
    return true;
  } catch (err) {
    console.error("Failed to switch protocol:", err);
    return false;
  }
}

export function getProtocolInstructions(): any {
  const active = getActiveProtocol();

  console.log(`[Protocol] Loading active instructions for: ${active}`);

  if (active === "protocol1") {
    return p1;
  } else if (active === "protocol5") {
    return p5;
  } else if (active === "cinematic_3agent") {
    return cinematic3Agent;
  } else if (active === "cinematic_simple") {
    return cinematicSimple;
  } else if (active === "autogen") {
    return autogen;
  } else if (active === "adk_story") {
    return adkStory;
  }

  console.warn(`[Protocol] Unknown "${active}", falling back to autogen`);
  return autogen;
}
