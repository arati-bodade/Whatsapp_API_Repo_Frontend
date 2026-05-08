#!/usr/bin/env node

/**
 * Next.js Clean Start - Node.js entry point
 * 
 * Kills zombie node processes, frees port 3000,
 * removes .next/dev/lock, and starts the dev server.
 * 
 * Usage:
 *   node scripts/clean-start.js           Normal clean start
 *   node scripts/clean-start.js --clean   Also wipe .next cache
 *   node scripts/clean-start.js --dry     Dry run
 */

const { execSync, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const PROJECT_NAME = path.basename(PROJECT_ROOT);
const PORT = 3000;

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry");
const CLEAN = args.includes("--clean");

// -- Helpers ---------------------------------------------------------------
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const magenta = (s) => `\x1b[35m${s}\x1b[0m`;
const gray = (s) => `\x1b[90m${s}\x1b[0m`;

function stage(num, msg) { console.log(`\n  ${cyan(`[${num}]`)} ${msg}`); }
function ok(msg) { console.log(`      ${green(msg)}`); }
function warn(msg) { console.log(`      ${yellow(msg)}`); }
function detail(msg) { console.log(`      ${gray(msg)}`); }

function run(cmd) {
    try {
        return execSync(cmd, { encoding: "utf8", timeout: 10000, windowsHide: true }).trim();
    } catch {
        return "";
    }
}

// -- Banner ----------------------------------------------------------------
console.log();
console.log(magenta("  ============================================="));
console.log(magenta(`    Next.js Clean Start -- ${PROJECT_NAME}`));
console.log(magenta("  ============================================="));
if (DRY_RUN) console.log(yellow("  [DRY RUN]"));

// -- Stage 1: Find and kill processes on the port -------------------------
stage("1", `Freeing port ${PORT}...`);

const netstat = path.join(process.env.SystemRoot || "C:\\WINDOWS", "System32", "netstat.exe");
let pidsOnPort = [];

if (fs.existsSync(netstat)) {
    const output = run(`"${netstat}" -ano`);
    const lines = output.split("\n");
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.includes(`:${PORT}`) && trimmed.includes("LISTENING")) {
            const parts = trimmed.split(/\s+/);
            const pid = parseInt(parts[parts.length - 1], 10);
            if (pid && pid > 0 && !pidsOnPort.includes(pid)) {
                pidsOnPort.push(pid);
            }
        }
    }
}

if (pidsOnPort.length > 0) {
    for (const pid of pidsOnPort) {
        detail(`Port ${PORT} held by PID ${pid}`);
        if (!DRY_RUN) {
            try {
                process.kill(pid, "SIGTERM");
            } catch { /* already dead or access denied */ }
            try {
                process.kill(pid, "SIGKILL");
            } catch { /* already dead or access denied */ }
        }
    }
    ok(`Processed ${pidsOnPort.length} process(es) on port ${PORT}.`);
} else {
    ok(`Port ${PORT} is available.`);
}

// -- Stage 2: Kill remaining node processes (best-effort) -----------------
stage("2", "Killing zombie node processes...");

const tasklist = path.join(process.env.SystemRoot || "C:\\WINDOWS", "System32", "tasklist.exe");
let nodeKilled = 0;

if (fs.existsSync(tasklist)) {
    const output = run(`"${tasklist}" /FI "IMAGENAME eq node.exe" /FO CSV /NH`);
    const lines = output.split("\n").filter(l => l.includes("node.exe"));

    const nodePids = [];
    for (const line of lines) {
        // CSV format: "node.exe","PID","Session","SessionNum","Mem"
        const match = line.match(/"node\.exe","(\d+)"/i);
        if (match) {
            const pid = parseInt(match[1], 10);
            if (pid && pid !== process.pid && !pidsOnPort.includes(pid)) {
                nodePids.push(pid);
            }
        }
    }

    for (const pid of nodePids) {
        detail(`Killing node PID ${pid}`);
        if (!DRY_RUN) {
            try { process.kill(pid, "SIGTERM"); } catch { /* ignore */ }
            try { process.kill(pid, "SIGKILL"); } catch { /* ignore */ }
        }
        nodeKilled++;
    }
}

if (nodeKilled > 0) {
    ok(`Processed ${nodeKilled} zombie process(es).`);
} else {
    ok("No additional zombie processes found.");
}

// -- Stage 3: Remove lock file -------------------------------------------
stage("3", "Removing lock file...");

const lockFile = path.join(PROJECT_ROOT, ".next", "dev", "lock");
if (fs.existsSync(lockFile)) {
    if (!DRY_RUN) {
        try { fs.unlinkSync(lockFile); } catch { /* ignore */ }
    }
    ok("Lock file removed.");
} else {
    ok("No lock file found.");
}

// -- Stage 4 (optional): Clean .next cache --------------------------------
if (CLEAN) {
    stage("4", "Wiping .next cache...");
    const nextDir = path.join(PROJECT_ROOT, ".next");
    if (fs.existsSync(nextDir)) {
        if (!DRY_RUN) {
            try { fs.rmSync(nextDir, { recursive: true, force: true }); } catch { /* ignore */ }
        }
        ok(".next directory removed.");
    } else {
        ok(".next directory does not exist.");
    }
}

// -- Stage 5: Start dev server --------------------------------------------
stage("5", "Starting Next.js dev server...\n");

if (DRY_RUN) {
    console.log(yellow("  [DRY RUN] Would run: next dev"));
    process.exit(0);
}

// Wait a moment for OS to release port handles
setTimeout(() => {
    const child = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["next", "dev"], {
        cwd: PROJECT_ROOT,
        stdio: "inherit",
    });

    child.on("error", (err) => {
        console.error(`Failed to start dev server: ${err.message}`);
        process.exit(1);
    });

    child.on("exit", (code) => {
        process.exit(code || 0);
    });
}, 1000);
