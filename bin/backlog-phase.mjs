#!/usr/bin/env node
// backlog-phase: automation for the phase-driven roadmap described in docs/roadmap-guide.md.
// Phases are Backlog.md milestones named "Phase N: <name>"; this reads/writes them through the
// `backlog` CLI only, so it works standalone in any Backlog.md repo and needs no AI Hub server.
//
// Usage:
//   backlog-phase status  <PHASE> [--path <dir> | --project <id|name>] [--json]
//   backlog-phase check   <PHASE> [--path <dir> | --project <id|name>] [--json]
//   backlog-phase gate    <PHASE> [--approve|--rework] [--reviewer <name>] [--notes <text>] [--force] [--dry-run] [--json]
//   backlog-phase advance <PHASE> [--name <title>] [--description <text>] [--template <file>]
//                          [--no-tickets] [--force] [--dry-run] [--json]
//
// Global options:
//   --path <dir>        project directory (default: current directory)
//   --project <id|name> resolve the project path from the AI Hub registry (~/.config/ai-hub/projects.json)
//   --json               machine-readable output instead of text
//   -h, --help            show this help
//
// `<PHASE>` accepts a milestone id ("m-0"), a phase number ("0"), or a (partial, case-insensitive)
// title match ("Phase 0", "Foundation", "Phase 0: Foundation").
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";

const BACKLOG_BIN = process.env.BACKLOG_BIN || "backlog";
const DATA_DIR = process.env.AI_HUB_DATA_DIR || path.join(os.homedir(), ".config", "ai-hub");
const REGISTRY_FILE = path.join(DATA_DIR, "projects.json");
const RUN_TIMEOUT_MS = 15000;
const LIST_TIMEOUT_MS = 8000;
const FINISHED_STATUS = /^(done|closed)$/i;
const CONFIG_CANDIDATES = ["backlog/config.yml", ".backlog/config.yml", "backlog.config.yml"];
const GATE_LOG_REL = path.join("backlog", "phase-gates.json");
const PHASE_NUMBER = /^Phase\s+(\d+)\s*:?/i;

// Built-in four-phase template, matching templates/init-roadmap.sh milestone names and the
// typical tickets documented in docs/roadmap-guide.md. `advance` falls back to this when no
// `--template` file is given and the current phase name matches "Phase N: ...".
const BUILTIN_PHASES = [
	{
		name: "Phase 0: Foundation",
		description: "Repository setup, architecture, core infrastructure",
		tickets: [
			{ title: "P0-1 Repository setup", ac: ["CI/CD pipeline runs", "Project structure documented"] },
			{ title: "P0-2 Architecture design", ac: ["Architecture documented and reviewed", "Key dependencies identified"] },
			{ title: "P0-3 Core modules", ac: ["Core utilities implemented", "Modules are testable and decoupled"] },
			{ title: "P0-4 Data structures", ac: ["Schemas and models defined", "Persistence layer in place"] },
			{ title: "P0-5 Build system verification", ac: ["Build transpiles/bundles cleanly", "Lint passes"] },
		],
	},
	{
		name: "Phase 1: Features",
		description: "Develop and integrate main capabilities",
		tickets: [
			{ title: "P1-1 Feature 1", ac: ["Primary capability implemented"] },
			{ title: "P1-2 Feature 2", ac: ["Secondary capability implemented"] },
			{ title: "P1-3 Feature 3", ac: ["Additional capability implemented"] },
			{ title: "P1-4 Integration hooks", ac: ["Cross-feature integration or optional hooks wired"] },
			{ title: "P1-5 API / module contracts", ac: ["Contracts documented", "Breaking changes called out"] },
			{ title: "P1-6 Integration testing", ac: ["Cross-module scenarios covered", "No critical bugs in main paths"] },
		],
	},
	{
		name: "Phase 2: Polish",
		description: "Optimize, test, refine UX and user experience",
		tickets: [
			{ title: "P2-1 Performance optimization", ac: ["Profiling done", "Bottlenecks fixed"] },
			{ title: "P2-2 UI/UX polish", ac: ["Visual refinement complete", "Accessibility checked"] },
			{ title: "P2-3 Comprehensive testing", ac: ["Edge cases covered", "Security and load tested"] },
			{ title: "P2-4 Error handling", ac: ["User-facing messages reviewed", "Logging in place"] },
			{ title: "P2-5 Documentation updates", ac: ["API docs updated", "User guides updated"] },
		],
	},
	{
		name: "Phase 3: Release",
		description: "Final QA, documentation, production readiness",
		tickets: [
			{ title: "P3-1 Final QA and edge-case testing", ac: ["No P0/P1 bugs remaining"] },
			{ title: "P3-2 Release documentation", ac: ["Changelog written", "Migration guide included"] },
			{ title: "P3-3 Security audit and hardening", ac: ["Security review completed"] },
			{ title: "P3-4 Deployment procedure and rollback plan", ac: ["Deployment steps documented", "Rollback plan verified"] },
		],
	},
];

class CliError extends Error {}

function runBacklog(cwd, args, timeoutMs) {
	return new Promise((resolve, reject) => {
		execFile(BACKLOG_BIN, args, { cwd, timeout: timeoutMs, maxBuffer: 8 * 1024 * 1024 }, (error, stdout, stderr) => {
			if (error) {
				const detail = (stderr || stdout || error.message).toString().trim().split("\n").slice(-3).join(" ");
				reject(new CliError(error.killed ? `backlog timed out after ${timeoutMs}ms` : detail));
				return;
			}
			resolve(stdout.toString());
		});
	});
}

async function runBacklogJson(cwd, args, timeoutMs) {
	return JSON.parse(await runBacklog(cwd, args, timeoutMs));
}

function isInitialized(dir) {
	return fs.existsSync(dir) && fs.statSync(dir).isDirectory() && CONFIG_CANDIDATES.some((rel) => fs.existsSync(path.join(dir, rel)));
}

function readRegistry() {
	try {
		const parsed = JSON.parse(fs.readFileSync(REGISTRY_FILE, "utf8"));
		return Array.isArray(parsed.projects) ? parsed.projects : [];
	} catch {
		return [];
	}
}

function resolveProjectPath(opts) {
	if (opts.path) return path.resolve(opts.path);
	if (opts.project) {
		const needle = opts.project.toLowerCase();
		const match = readRegistry().find((p) => p.id === opts.project || p.name.toLowerCase() === needle);
		if (!match) throw new CliError(`No AI Hub project matches --project "${opts.project}" (check ${REGISTRY_FILE})`);
		return match.path;
	}
	return process.cwd();
}

// Backlog.md has no JSON output for milestones; parse the plain text and fail loudly if it does
// not match the declared section counts, so a format change surfaces as an error, not silence.
function parseMilestones(output) {
	const milestones = [];
	const declared = { Active: null, Completed: null };
	const found = { Active: 0, Completed: 0 };
	let section = null;
	for (const line of output.split("\n")) {
		const header = /^(Active|Completed) milestones \((\d+)\):/.exec(line);
		if (header) {
			section = header[1];
			declared[section] = Number(header[2]);
			continue;
		}
		const match = /^\s+(m-\d+): (.+) \((\d+)\/(\d+) done(?:, due (\d{4}-\d{2}-\d{2}))?\)$/.exec(line);
		if (!match || !section) continue;
		found[section] += 1;
		milestones.push({ id: match[1], title: match[2], done: Number(match[3]), total: Number(match[4]), due: match[5] || null, archived: section === "Completed" });
	}
	if (declared.Active === null || declared.Completed === null || found.Active !== declared.Active || found.Completed !== declared.Completed) {
		throw new CliError("Unrecognized `backlog milestone list` output; Backlog.md format may have changed");
	}
	return milestones;
}

async function listMilestones(cwd) {
	return parseMilestones(await runBacklog(cwd, ["milestone", "list", "--show-completed", "--plain"], LIST_TIMEOUT_MS));
}

// Resolve a user-supplied phase selector against the project's milestones, trying (in order) an
// exact id, an exact title, a "Phase N" number match, then a case-insensitive substring match.
function resolvePhaseArg(milestones, phaseArg) {
	const needle = phaseArg.trim();
	const byId = milestones.find((m) => m.id.toLowerCase() === needle.toLowerCase());
	if (byId) return byId;
	const byTitle = milestones.find((m) => m.title.toLowerCase() === needle.toLowerCase());
	if (byTitle) return byTitle;
	if (/^\d+$/.test(needle)) {
		const byNumber = milestones.filter((m) => PHASE_NUMBER.test(m.title) && PHASE_NUMBER.exec(m.title)[1] === needle);
		if (byNumber.length === 1) return byNumber[0];
		if (byNumber.length > 1) throw new CliError(`Ambiguous phase number "${needle}": ${byNumber.map((m) => m.title).join(", ")}`);
	}
	const bySubstring = milestones.filter((m) => m.title.toLowerCase().includes(needle.toLowerCase()));
	if (bySubstring.length === 1) return bySubstring[0];
	if (bySubstring.length > 1) throw new CliError(`Ambiguous phase "${needle}": ${bySubstring.map((m) => m.title).join(", ")}`);
	const available = milestones.length ? milestones.map((m) => `${m.id} ${m.title}`).join("\n  ") : "(none)";
	throw new CliError(`No phase matches "${needle}". Available phases:\n  ${available}`);
}

async function loadPhaseTasks(cwd, milestoneId) {
	const data = await runBacklogJson(cwd, ["task", "list", "--json", "-m", milestoneId], LIST_TIMEOUT_MS);
	return data.tasks || [];
}

async function loadTaskDetail(cwd, taskId) {
	const data = await runBacklogJson(cwd, ["task", "view", taskId, "--json"], LIST_TIMEOUT_MS);
	return data.task;
}

function summarize(tasks) {
	const byStatus = {};
	for (const task of tasks) byStatus[task.status] = (byStatus[task.status] || 0) + 1;
	const done = tasks.filter((t) => FINISHED_STATUS.test(t.status)).length;
	const total = tasks.length;
	return { total, done, percent: total ? Math.round((done / total) * 1000) / 10 : 0, byStatus };
}

function isLocalDoc(ref) {
	return !/^[a-z]+:\/\//i.test(ref);
}

// Documentation references (`--doc`) are only exposed by `task view`, not `task list`, so this
// fetches each task's detail. Phases are small (a handful of tickets), so sequential calls are fine.
async function collectDocIssues(cwd, tasks) {
	const missing = [];
	let referenced = 0;
	for (const task of tasks) {
		const detail = await loadTaskDetail(cwd, task.id);
		for (const ref of detail.documentation || []) {
			if (!isLocalDoc(ref)) continue;
			referenced += 1;
			if (!fs.existsSync(path.join(cwd, ref))) missing.push({ taskId: task.id, doc: ref });
		}
	}
	return { referenced, missing };
}

async function collectAcceptanceIssues(cwd, tasks) {
	const incomplete = [];
	for (const task of tasks) {
		const detail = await loadTaskDetail(cwd, task.id);
		const criteria = detail.acceptanceCriteria || [];
		const unchecked = criteria.filter((c) => !c.checked);
		if (unchecked.length) incomplete.push({ taskId: task.id, unchecked: unchecked.map((c) => c.text) });
	}
	return incomplete;
}

function needsReviewTasks(tasks) {
	return tasks.filter((t) => (t.labels || []).includes("needs-review")).map((t) => t.id);
}

async function runChecks(cwd, phase, tasks) {
	const notDone = tasks.filter((t) => !FINISHED_STATUS.test(t.status)).map((t) => ({ id: t.id, title: t.title, status: t.status }));
	const docs = await collectDocIssues(cwd, tasks);
	return {
		allDone: { pass: notDone.length === 0, notDone },
		docs: { pass: docs.missing.length === 0, referenced: docs.referenced, missing: docs.missing },
	};
}

async function runGateChecklist(cwd, phase, tasks) {
	const base = await runChecks(cwd, phase, tasks);
	const review = needsReviewTasks(tasks);
	const acceptance = await collectAcceptanceIssues(cwd, tasks);
	return {
		...base,
		codeReview: { pass: review.length === 0, pending: review },
		tests: { pass: acceptance.length === 0, incomplete: acceptance },
	};
}

function checksPass(checks) {
	return Object.values(checks).every((c) => c.pass);
}

function readGateLog(cwd) {
	try {
		const parsed = JSON.parse(fs.readFileSync(path.join(cwd, GATE_LOG_REL), "utf8"));
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function appendGateLog(cwd, record) {
	const file = path.join(cwd, GATE_LOG_REL);
	const log = readGateLog(cwd);
	log.push(record);
	fs.mkdirSync(path.dirname(file), { recursive: true });
	fs.writeFileSync(file, JSON.stringify(log, null, 2) + "\n");
}

function latestGateDecision(cwd, milestoneId) {
	const log = readGateLog(cwd).filter((r) => r.milestoneId === milestoneId);
	return log.length ? log[log.length - 1] : null;
}

// ---- output helpers ----

function printChecklist(label, checks) {
	console.log(`\n${label}`);
	for (const [name, result] of Object.entries(checks)) {
		console.log(`  [${result.pass ? "x" : " "}] ${name}`);
	}
}

function reportIssues(checks) {
	if (checks.allDone && !checks.allDone.pass) {
		console.log("\nTasks not Done:");
		for (const t of checks.allDone.notDone) console.log(`  ${t.id} [${t.status}] ${t.title}`);
	}
	if (checks.docs && !checks.docs.pass) {
		console.log("\nMissing documentation files:");
		for (const m of checks.docs.missing) console.log(`  ${m.taskId}: ${m.doc}`);
	}
	if (checks.codeReview && !checks.codeReview.pass) {
		console.log("\nPending code review (needs-review label):");
		for (const id of checks.codeReview.pending) console.log(`  ${id}`);
	}
	if (checks.tests && !checks.tests.pass) {
		console.log("\nUnchecked acceptance criteria:");
		for (const t of checks.tests.incomplete) for (const c of t.unchecked) console.log(`  ${t.taskId}: ${c}`);
	}
}

// ---- commands ----

async function cmdStatus(cwd, phaseArg, opts) {
	const milestones = await listMilestones(cwd);
	const phase = resolvePhaseArg(milestones, phaseArg);
	const tasks = await loadPhaseTasks(cwd, phase.id);
	const summary = summarize(tasks);
	if (opts.json) {
		console.log(JSON.stringify({ phase: phase.title, milestoneId: phase.id, due: phase.due, archived: phase.archived, ...summary, tasks: tasks.map((t) => ({ id: t.id, title: t.title, status: t.status, labels: t.labels, acceptanceCriteriaCompleted: t.acceptanceCriteriaCompleted, acceptanceCriteriaCount: t.acceptanceCriteriaCount })) }, null, 2));
		return 0;
	}
	console.log(`${phase.title} (${phase.id})${phase.due ? ` — due ${phase.due}` : ""}`);
	console.log(`${summary.done}/${summary.total} tasks done (${summary.percent}%)`);
	const statusEntries = Object.entries(summary.byStatus);
	if (statusEntries.length) console.log(statusEntries.map(([s, n]) => `${s}: ${n}`).join(", "));
	console.log("");
	if (!tasks.length) {
		console.log("(no tasks in this phase)");
	} else {
		for (const t of tasks) {
			const ac = t.acceptanceCriteriaCount ? ` [AC ${t.acceptanceCriteriaCompleted}/${t.acceptanceCriteriaCount}]` : "";
			const labels = t.labels && t.labels.length ? ` {${t.labels.join(",")}}` : "";
			console.log(`  ${t.id}  ${t.status.padEnd(12)} ${t.title}${ac}${labels}`);
		}
	}
	return 0;
}

async function cmdCheck(cwd, phaseArg, opts) {
	const milestones = await listMilestones(cwd);
	const phase = resolvePhaseArg(milestones, phaseArg);
	const tasks = await loadPhaseTasks(cwd, phase.id);
	const checks = await runChecks(cwd, phase, tasks);
	const pass = checksPass(checks);
	if (opts.json) {
		console.log(JSON.stringify({ phase: phase.title, milestoneId: phase.id, pass, checks }, null, 2));
		return pass ? 0 : 1;
	}
	console.log(`${phase.title} (${phase.id}): ${pass ? "PASS" : "FAIL"}`);
	printChecklist("Checks", { "all tasks Done": checks.allDone, "documentation files exist": checks.docs });
	reportIssues(checks);
	if (checks.docs.pass && checks.docs.referenced === 0) console.log("\nNote: no tasks in this phase reference documentation (--doc); nothing to verify.");
	return pass ? 0 : 1;
}

async function cmdGate(cwd, phaseArg, opts) {
	const milestones = await listMilestones(cwd);
	const phase = resolvePhaseArg(milestones, phaseArg);
	const tasks = await loadPhaseTasks(cwd, phase.id);
	const checks = await runGateChecklist(cwd, phase, tasks);
	const pass = checksPass(checks);

	if (opts.approve || opts.rework) {
		const decision = opts.approve ? "approved" : "rework";
		if (decision === "approved" && !pass && !opts.force) {
			if (!opts.json) {
				printChecklist("Gate checklist", { "all tasks Done": checks.allDone, "documentation files exist": checks.docs, "code review complete": checks.codeReview, "acceptance criteria verified": checks.tests });
				reportIssues(checks);
			}
			throw new CliError("Refusing to approve: automated checks are failing. Fix them or re-run with --force.");
		}
		const record = { phase: phase.title, milestoneId: phase.id, decision, date: new Date().toISOString(), reviewer: opts.reviewer || null, notes: opts.notes || null };
		if (opts.dryRun) {
			if (opts.json) console.log(JSON.stringify({ dryRun: true, pass, checks, record }, null, 2));
			else {
				console.log(`[dry-run] would record ${decision} for ${phase.title} (${phase.id}) in ${GATE_LOG_REL}:`);
				console.log(`  ${JSON.stringify(record)}`);
			}
			return 0;
		}
		appendGateLog(cwd, record);
		if (opts.json) console.log(JSON.stringify({ recorded: true, pass, checks, record }, null, 2));
		else console.log(`Recorded "${decision}" for ${phase.title} (${phase.id}) in ${GATE_LOG_REL}.`);
		return 0;
	}

	// No decision flag: print the checklist (read-only), exit status reflects pass/fail.
	if (opts.json) {
		console.log(JSON.stringify({ phase: phase.title, milestoneId: phase.id, pass, checks, lastDecision: latestGateDecision(cwd, phase.id) }, null, 2));
		return pass ? 0 : 1;
	}
	console.log(`${phase.title} (${phase.id}) gate checklist: ${pass ? "READY" : "NOT READY"}`);
	printChecklist("Checklist", { "all tasks Done": checks.allDone, "documentation files exist": checks.docs, "code review complete (no needs-review)": checks.codeReview, "acceptance criteria verified": checks.tests });
	reportIssues(checks);
	const last = latestGateDecision(cwd, phase.id);
	console.log(last ? `\nLast recorded decision: ${last.decision} on ${last.date}${last.reviewer ? ` by ${last.reviewer}` : ""}` : "\nNo gate decision recorded yet. Use --approve or --rework to record one.");
	return pass ? 0 : 1;
}

function loadTemplate(opts, currentTitle) {
	if (opts.template) {
		const parsed = JSON.parse(fs.readFileSync(path.resolve(opts.template), "utf8"));
		if (!parsed.name) throw new CliError(`--template file must have a "name" field`);
		return { name: parsed.name, description: parsed.description || "", tickets: parsed.tickets || [] };
	}
	const match = PHASE_NUMBER.exec(currentTitle);
	if (match) {
		const next = BUILTIN_PHASES.find((p) => PHASE_NUMBER.exec(p.name)[1] === String(Number(match[1]) + 1));
		if (next) return next;
	}
	if (!opts.name) throw new CliError("No built-in template for the next phase; pass --name <title> (and optional --description, --template <file>).");
	return { name: opts.name, description: opts.description || "", tickets: [] };
}

async function cmdAdvance(cwd, phaseArg, opts) {
	const milestones = await listMilestones(cwd);
	const phase = resolvePhaseArg(milestones, phaseArg);
	const tasks = await loadPhaseTasks(cwd, phase.id);

	if (!opts.force) {
		const checks = await runChecks(cwd, phase, tasks);
		const gateOk = latestGateDecision(cwd, phase.id)?.decision === "approved";
		if (!checksPass(checks) || !gateOk) {
			reportIssues(checks);
			if (!gateOk) console.log(`\nNo "approved" gate decision recorded for ${phase.title} (${phase.id}). Run: backlog-phase gate ${phase.id} --approve`);
			throw new CliError(`Refusing to advance from ${phase.title}: phase is not ready. Re-run with --force to override.`);
		}
	}

	const template = loadTemplate(opts, phase.title);
	const title = opts.name || template.name;
	if (milestones.some((m) => m.title.toLowerCase() === title.toLowerCase())) {
		throw new CliError(`Milestone "${title}" already exists (${milestones.find((m) => m.title.toLowerCase() === title.toLowerCase()).id}).`);
	}
	const description = opts.description || template.description || "";
	const tickets = opts.noTickets ? [] : template.tickets || [];

	if (opts.dryRun) {
		const plan = { milestone: { title, description }, tickets: tickets.map((t) => ({ title: t.title, ac: t.ac || [] })) };
		if (opts.json) console.log(JSON.stringify({ dryRun: true, from: phase.title, plan }, null, 2));
		else {
			console.log(`[dry-run] would create milestone "${title}"${description ? ` — ${description}` : ""}`);
			for (const t of tickets) console.log(`  + ${t.title}${(t.ac || []).length ? `  (ac: ${t.ac.join("; ")})` : ""}`);
			if (!tickets.length) console.log("  (no tickets; --no-tickets or empty template)");
		}
		return 0;
	}

	const addArgs = ["milestone", "add", title];
	if (description) addArgs.push("--description", description);
	const addOutput = await runBacklog(cwd, addArgs, RUN_TIMEOUT_MS);
	const idMatch = /\(m-(\d+)\)/.exec(addOutput);
	const milestoneId = idMatch ? `m-${idMatch[1]}` : title;

	const created = [];
	for (const ticket of tickets) {
		const createArgs = ["task", "create", ticket.title, "-m", milestoneId];
		for (const ac of ticket.ac || []) createArgs.push("--ac", ac);
		if (ticket.description) createArgs.push("--description", ticket.description);
		const out = await runBacklog(cwd, createArgs, RUN_TIMEOUT_MS);
		const taskMatch = /Created task (\S+)/.exec(out);
		created.push({ title: ticket.title, id: taskMatch ? taskMatch[1] : null });
	}

	if (opts.json) {
		console.log(JSON.stringify({ from: phase.title, created: { milestone: { id: milestoneId, title, description }, tickets: created } }, null, 2));
	} else {
		console.log(`Created ${title} (${milestoneId})${description ? ` — ${description}` : ""}`);
		for (const t of created) console.log(`  + ${t.id || "?"} ${t.title}`);
	}
	return 0;
}

// ---- argv parsing ----

const HELP = `backlog-phase: automation for the phase-driven Backlog.md roadmap

Usage:
  backlog-phase status  <PHASE> [options]     show completion % and task list for a phase
  backlog-phase check   <PHASE> [options]     validate all tasks Done and referenced docs exist
  backlog-phase gate    <PHASE> [options]     gate checklist (docs, code review, tests); record a decision
  backlog-phase advance <PHASE> [options]     create the next phase's milestone + tickets from a template

Global options:
  --path <dir>          project directory (default: current directory)
  --project <id|name>   resolve the project path from the AI Hub registry
  --json                 machine-readable output
  -h, --help              show this help

gate options:
  --approve              record an "approved" decision (requires checks to pass unless --force)
  --rework               record a "rework" decision
  --reviewer <name>       reviewer name stored with the decision
  --notes <text>          notes stored with the decision
  --force                 allow --approve despite failing checks
  --dry-run               preview the decision record without writing backlog/phase-gates.json

advance options:
  --name <title>          next phase title (required if no built-in template applies)
  --description <text>    next phase (milestone) description
  --template <file>       JSON file: { "name", "description", "tickets": [{ "title", "ac": [] }] }
  --no-tickets             create the milestone only, skip ticket creation
  --force                  skip the "current phase done + gate approved" precondition
  --dry-run                preview the milestone/tickets without creating them

<PHASE> accepts a milestone id ("m-0"), a phase number ("0"), or a (partial, case-insensitive)
title match ("Phase 0", "Foundation", "Phase 0: Foundation").
`;

function parseArgs(argv) {
	const opts = { _: [] };
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		const next = () => argv[++i];
		switch (arg) {
			case "-h":
			case "--help":
				opts.help = true;
				break;
			case "--path":
				opts.path = next();
				break;
			case "--project":
				opts.project = next();
				break;
			case "--json":
				opts.json = true;
				break;
			case "--dry-run":
				opts.dryRun = true;
				break;
			case "--force":
				opts.force = true;
				break;
			case "--approve":
				opts.approve = true;
				break;
			case "--rework":
				opts.rework = true;
				break;
			case "--reviewer":
				opts.reviewer = next();
				break;
			case "--notes":
				opts.notes = next();
				break;
			case "--name":
				opts.name = next();
				break;
			case "--description":
				opts.description = next();
				break;
			case "--template":
				opts.template = next();
				break;
			case "--no-tickets":
				opts.noTickets = true;
				break;
			default:
				if (arg.startsWith("--")) throw new CliError(`Unknown option: ${arg}`);
				opts._.push(arg);
		}
	}
	return opts;
}

async function main() {
	const opts = parseArgs(process.argv.slice(2));
	const [command, phaseArg] = opts._;
	if (opts.help || !command) {
		console.log(HELP);
		return command ? 0 : (opts.help ? 0 : 1);
	}
	if (opts.approve && opts.rework) throw new CliError("--approve and --rework are mutually exclusive");

	const cwd = resolveProjectPath(opts);
	if (!isInitialized(cwd)) throw new CliError(`Not a Backlog.md project (no backlog/config.yml found) at ${cwd}`);

	if (["check", "gate", "advance"].includes(command) || command === "status") {
		if (!phaseArg) throw new CliError(`Usage: backlog-phase ${command} <PHASE> [options]`);
	}

	switch (command) {
		case "status":
			return cmdStatus(cwd, phaseArg, opts);
		case "check":
			return cmdCheck(cwd, phaseArg, opts);
		case "gate":
			return cmdGate(cwd, phaseArg, opts);
		case "advance":
			return cmdAdvance(cwd, phaseArg, opts);
		default:
			throw new CliError(`Unknown command: ${command}\n\n${HELP}`);
	}
}

main()
	.then((code) => process.exit(code || 0))
	.catch((error) => {
		console.error(error instanceof CliError ? `Error: ${error.message}` : error.stack || String(error));
		process.exit(1);
	});
