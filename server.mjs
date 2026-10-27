#!/usr/bin/env node
// AI Hub: local manager for Backlog.md projects. Projects are added by hand; each gets its own dashboard.
// Stores only a registry (name, path, port). Task data stays inside each repo (backlog/*.md).
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import net from "node:net";
import path from "node:path";
import crypto from "node:crypto";
import { execFile, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4880);
const DATA_DIR = process.env.AI_HUB_DATA_DIR || path.join(os.homedir(), ".config", "ai-hub");
const REGISTRY_FILE = path.join(DATA_DIR, "projects.json");
const LOG_DIR = path.join(DATA_DIR, "logs");
const BACKLOG_BIN = process.env.BACKLOG_BIN || "backlog";
const DASH_PORT_FROM = Number(process.env.AI_HUB_DASH_FROM || 6500);
const DASH_PORT_TO = Number(process.env.AI_HUB_DASH_TO || 6599);
const SUMMARY_TTL_MS = 4000;
const SUMMARY_TIMEOUT_MS = 8000;
const RESERVED_PREFIXES = ["draft", "doc", "decision"];
const PROTOCOL_START = "<!-- AI-HUB PROTOCOL START -->";
const PROTOCOL_END = "<!-- AI-HUB PROTOCOL END -->";
const BACKLOG_GUIDELINES = /<!-- BACKLOG\.MD GUIDELINES START -->[\s\S]*?<!-- BACKLOG\.MD GUIDELINES END -->/;
const INSTRUCTION_FILES = ["AGENTS.md", "CLAUDE.md", "GEMINI.md"];
const MODEL_TIERS = ["dev-high", "dev-medium", "dev-low", "art"];
const PROVIDER_ICONS = new Map([
	["/assets/providers/claude.svg", "claude.svg"],
	["/assets/providers/openai.svg", "openai.svg"],
	["/assets/providers/gemini.svg", "gemini.svg"],
	["/assets/providers/deepseek.svg", "deepseek.svg"],
]);

const children = new Map();
const summaryCache = new Map();

class HttpError extends Error {
	constructor(status, message) {
		super(message);
		this.status = status;
	}
}

function readRegistry() {
	try {
		const parsed = JSON.parse(fs.readFileSync(REGISTRY_FILE, "utf8"));
		return Array.isArray(parsed.projects) ? parsed : { projects: [] };
	} catch {
		return { projects: [] };
	}
}

function writeRegistry(registry) {
	fs.mkdirSync(DATA_DIR, { recursive: true });
	const tmp = `${REGISTRY_FILE}.${process.pid}.tmp`;
	fs.writeFileSync(tmp, JSON.stringify(registry, null, 2));
	fs.renameSync(tmp, REGISTRY_FILE);
}

function findProject(registry, id) {
	const project = registry.projects.find((entry) => entry.id === id);
	if (!project) throw new HttpError(404, "Project not found");
	return project;
}

function runBacklog(cwd, args, timeoutMs) {
	return new Promise((resolve, reject) => {
		execFile(BACKLOG_BIN, args, { cwd, timeout: timeoutMs, maxBuffer: 8 * 1024 * 1024 }, (error, stdout, stderr) => {
			if (error) {
				const detail = (stderr || stdout || error.message).toString().trim().split("\n").slice(-3).join(" ");
				reject(new Error(error.killed ? `backlog timed out after ${timeoutMs}ms` : detail));
				return;
			}
			resolve(stdout.toString());
		});
	});
}

function inspectDirectory(dir) {
	const exists = fs.existsSync(dir) && fs.statSync(dir).isDirectory();
	const initialized =
		exists &&
		["backlog/config.yml", ".backlog/config.yml", "backlog.config.yml"].some((rel) => fs.existsSync(path.join(dir, rel)));
	return { exists, initialized, isGit: exists && fs.existsSync(path.join(dir, ".git")) };
}

function isPortOpen(port) {
	return new Promise((resolve) => {
		const socket = net.connect({ port, host: "127.0.0.1" });
		const finish = (open) => {
			socket.destroy();
			resolve(open);
		};
		socket.setTimeout(300, () => finish(false));
		socket.once("connect", () => finish(true));
		socket.once("error", () => finish(false));
	});
}

function listenerInfo(port) {
	return new Promise((resolve) => {
		execFile("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-Fpc"], (error, stdout) => {
			if (error) return resolve(null);
			const pid = /^p(\d+)/m.exec(stdout);
			const command = /^c(.+)/m.exec(stdout);
			resolve(pid ? { pid: Number(pid[1]), command: command ? command[1] : "" } : null);
		});
	});
}

async function allocatePort(registry) {
	const used = new Set(registry.projects.map((entry) => entry.port));
	for (let port = DASH_PORT_FROM; port <= DASH_PORT_TO; port += 1) {
		if (!used.has(port) && !(await isPortOpen(port))) return port;
	}
	throw new HttpError(507, `No free dashboard port in ${DASH_PORT_FROM}-${DASH_PORT_TO}`);
}

async function waitForPort(port, child, timeoutMs) {
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		if (child.exitCode !== null) return false;
		if (await isPortOpen(port)) return true;
		await new Promise((resolve) => setTimeout(resolve, 200));
	}
	return false;
}

async function startDashboard(registry, project) {
	if (await isPortOpen(project.port)) {
		const owner = await listenerInfo(project.port);
		if (children.has(project.id) || (owner && owner.command.startsWith("backlog"))) return;
		project.port = await allocatePort(registry);
		writeRegistry(registry);
	}
	fs.mkdirSync(LOG_DIR, { recursive: true });
	const logFd = fs.openSync(path.join(LOG_DIR, `${project.id}.log`), "a");
	const args = ["browser", "--port", String(project.port), "--no-open", "--non-interactive"];
	const child = spawn(BACKLOG_BIN, args, { cwd: project.path, stdio: ["ignore", logFd, logFd] });
	fs.closeSync(logFd);
	children.set(project.id, child);
	child.once("exit", () => children.delete(project.id));
	if (!(await waitForPort(project.port, child, 10000))) {
		child.kill("SIGTERM");
		throw new HttpError(500, `Dashboard did not start; see ${path.join(LOG_DIR, `${project.id}.log`)}`);
	}
}

async function stopDashboard(project) {
	const child = children.get(project.id);
	if (child) {
		child.kill("SIGTERM");
		return;
	}
	const owner = await listenerInfo(project.port);
	if (owner && owner.command.startsWith("backlog")) process.kill(owner.pid, "SIGTERM");
}

const UNPLANNED_LIMIT = 50;
const FINISHED_STATUS = /^(done|closed)$/i;
const CONFIG_CANDIDATES = ["backlog/config.yml", ".backlog/config.yml", "backlog.config.yml"];
const STATUSES_LINE = /^statuses:[ \t]*(\[.*\])/m;

function summarizeTasks(tasks) {
	const counts = {};
	const inProgress = [];
	const unplanned = [];
	let unplannedTotal = 0;
	for (const task of tasks) {
		counts[task.status] = (counts[task.status] || 0) + 1;
		if (/progress/i.test(task.status)) {
			inProgress.push({ id: task.id, title: task.title, priority: task.priority });
		}
		if (!task.milestone && !FINISHED_STATUS.test(task.status)) {
			unplannedTotal += 1;
			if (unplanned.length < UNPLANNED_LIMIT) unplanned.push({ id: task.id, title: task.title });
		}
	}
	return { counts, total: tasks.length, inProgress, unplanned, unplannedTotal };
}

// Backlog.md has no JSON output for milestones; parse the plain text and fail loudly if it does not
// match the section counts it prints, so a format change surfaces as an error instead of an empty list.
function parseSprints(output) {
	const sprints = [];
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
		sprints.push({ id: match[1], title: match[2], done: Number(match[3]), total: Number(match[4]), due: match[5] || null, completed: section === "Completed" });
	}
	if (declared.Active === null || declared.Completed === null || found.Active !== declared.Active || found.Completed !== declared.Completed) {
		throw new Error("Unrecognized `backlog milestone list` output; Backlog.md format may have changed");
	}
	return sprints;
}

async function listSprints(project) {
	return parseSprints(await runBacklog(project.path, ["milestone", "list", "--show-completed", "--plain"], SUMMARY_TIMEOUT_MS));
}

// Backlog.md counts only "Done" as finished; AI Hub counts Done and Closed, so recompute from the task list.
function applyTaskCounts(sprints, tasks) {
	return sprints.map((sprint) => {
		const own = tasks.filter((task) => task.milestone === sprint.id);
		const done = own.filter((task) => FINISHED_STATUS.test(task.status)).length;
		return { ...sprint, done, total: own.length, completed: own.length > 0 && done === own.length };
	});
}

const PHASE_GATES_FILE = "backlog/phase-gates.json";

// Gate decisions are written externally by the `backlog-phase gate --approve/--rework` CLI helper
// as backlog/phase-gates.json: an array of { phase, milestoneId, decision, date, reviewer, notes }
// records, newest last. Missing file or unparsable JSON means no decisions exist yet.
function latestGateDecision(dir, milestoneId) {
	const file = path.join(dir, PHASE_GATES_FILE);
	if (!fs.existsSync(file)) return null;
	let records;
	try {
		records = JSON.parse(fs.readFileSync(file, "utf8"));
	} catch (error) {
		return null;
	}
	if (!Array.isArray(records)) return null;
	const matching = records.filter((record) => record && record.milestoneId === milestoneId);
	return matching.length ? matching[matching.length - 1] : null;
}

// Current phase is the milestone of the most common "In Progress" task; if nothing is in
// progress yet, falls back to the earliest active (non-completed) sprint so an unstarted
// project still reports a gate status. gateStatus is derived from task counts, then
// overridden by the latest recorded gate decision for that milestone, if any.
function computePhaseInfo(dir, sprints, tasks) {
	const counts = new Map();
	for (const task of tasks) {
		if (task.milestone && /progress/i.test(task.status)) counts.set(task.milestone, (counts.get(task.milestone) || 0) + 1);
	}
	let currentId = null;
	let max = 0;
	for (const [id, count] of counts) {
		if (count > max) {
			max = count;
			currentId = id;
		}
	}
	let sprint = currentId ? sprints.find((item) => item.id === currentId) : null;
	if (!sprint) sprint = sprints.find((item) => !item.completed) || null;
	if (!sprint) return { currentPhase: null, phaseProgress: null, gateStatus: null };
	const percent = sprint.total > 0 ? Math.round((sprint.done / sprint.total) * 100) : 0;
	const started = sprint.done > 0 || sprint.id === currentId;
	let gateStatus = sprint.completed ? "completed" : started ? "in-progress" : "not-started";
	const gate = latestGateDecision(dir, sprint.id);
	if (gate && gate.decision === "approved") gateStatus = "approved";
	else if (gate && gate.decision === "rework") gateStatus = "in-progress";
	return { currentPhase: sprint.title, phaseProgress: { total: sprint.total, done: sprint.done, percent }, gateStatus };
}

async function loadSummary(project) {
	const cached = summaryCache.get(project.id);
	if (cached && Date.now() - cached.at < SUMMARY_TTL_MS) return cached.value;
	let value;
	let tasks = [];
	try {
		const output = await runBacklog(project.path, ["task", "list", "--json"], SUMMARY_TIMEOUT_MS);
		tasks = JSON.parse(output).tasks || [];
		value = summarizeTasks(tasks);
	} catch (error) {
		value = { error: error.message };
	}
	if (!value.error) {
		try {
			value.sprints = applyTaskCounts(await listSprints(project), tasks);
		} catch (error) {
			value.sprints = [];
			value.sprintsError = error.message;
		}
		const phase = computePhaseInfo(project.path, value.sprints, tasks);
		value.currentPhase = phase.currentPhase;
		value.phaseProgress = phase.phaseProgress;
		value.gateStatus = phase.gateStatus;
	}
	summaryCache.set(project.id, { at: Date.now(), value });
	return value;
}

function protocolBlock() {
	const template = fs.readFileSync(path.join(HERE, "templates", "agent-protocol.md"), "utf8").trim();
	return `${PROTOCOL_START}\n${template}\n${PROTOCOL_END}`;
}

// True when an instruction file is missing or lacks the current protocol block.
function protocolStale(dir) {
	const block = protocolBlock();
	return INSTRUCTION_FILES.some((file) => {
		const target = path.join(dir, file);
		return !fs.existsSync(target) || !fs.readFileSync(target, "utf8").includes(block);
	});
}

async function describeProject(project) {
	const info = inspectDirectory(project.path);
	const running = info.exists && (await isPortOpen(project.port));
	const summary = info.initialized ? await loadSummary(project) : null;
	const stale = info.initialized && protocolStale(project.path);
	const hasPhase = summary && !summary.error;
	return {
		...project,
		...info,
		running,
		url: `http://127.0.0.1:${project.port}/`,
		summary,
		protocolStale: stale,
		currentPhase: hasPhase ? summary.currentPhase : null,
		phaseProgress: hasPhase ? summary.phaseProgress : null,
		gateStatus: hasPhase ? summary.gateStatus : null,
	};
}

function validateProjectPath(rawPath) {
	if (typeof rawPath !== "string" || !rawPath.trim()) throw new HttpError(400, "path is required");
	const expanded = rawPath.trim().replace(/^~(?=$|\/)/, os.homedir());
	if (!path.isAbsolute(expanded)) throw new HttpError(400, "path must be absolute");
	if (!inspectDirectory(expanded).exists) throw new HttpError(400, "directory does not exist");
	return fs.realpathSync(expanded);
}

// Read-only folder browser for the "Add project" popup. Lists only sub-directories of one
// directory; it never reads file contents and never writes anything. The server is already
// bound to 127.0.0.1 and host-checked, so this exposes nothing beyond the local user's own view.
function listDirectories(rawPath) {
	const requested = typeof rawPath === "string" && rawPath.trim() ? rawPath.trim() : os.homedir();
	const expanded = requested.replace(/^~(?=$|\/)/, os.homedir());
	if (!path.isAbsolute(expanded)) throw new HttpError(400, "path must be absolute");
	let dir;
	try {
		dir = fs.realpathSync(expanded);
		if (!fs.statSync(dir).isDirectory()) throw new Error("not a directory");
	} catch {
		throw new HttpError(400, "directory does not exist");
	}
	let entries;
	try {
		entries = fs.readdirSync(dir, { withFileTypes: true });
	} catch (error) {
		throw new HttpError(403, `cannot read directory: ${error.code || error.message}`);
	}
	const registered = new Set(readRegistry().projects.map((entry) => entry.path));
	const directories = [];
	for (const entry of entries) {
		if (entry.name.startsWith(".")) continue;
		const full = path.join(dir, entry.name);
		let isDir = entry.isDirectory();
		if (!isDir && entry.isSymbolicLink()) {
			try { isDir = fs.statSync(full).isDirectory(); } catch { isDir = false; }
		}
		if (!isDir) continue;
		let real = full;
		try { real = fs.realpathSync(full); } catch { /* keep the link path */ }
		const info = inspectDirectory(real);
		directories.push({ name: entry.name, path: real, isGit: info.isGit, initialized: info.initialized, added: registered.has(real) });
	}
	directories.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
	const parent = path.dirname(dir);
	const here = inspectDirectory(dir);
	return {
		path: dir,
		parent: parent === dir ? null : parent,
		home: os.homedir(),
		isGit: here.isGit,
		initialized: here.initialized,
		added: registered.has(dir),
		directories,
	};
}

function addProject(body) {
	const resolved = validateProjectPath(body.path);
	const registry = readRegistry();
	if (registry.projects.some((entry) => entry.path === resolved)) throw new HttpError(409, "Project already added");
	const name = (typeof body.name === "string" && body.name.trim()) || path.basename(resolved);
	return allocatePort(registry).then((port) => {
		const project = { id: crypto.randomUUID().slice(0, 8), name: name.slice(0, 80), path: resolved, port, addedAt: new Date().toISOString() };
		registry.projects.push(project);
		writeRegistry(registry);
		return project;
	});
}

async function removeProject(id) {
	const registry = readRegistry();
	const project = findProject(registry, id);
	await stopDashboard(project);
	registry.projects = registry.projects.filter((entry) => entry.id !== id);
	writeRegistry(registry);
	summaryCache.delete(id);
}

function applyProtocol(dir) {
	const block = protocolBlock();
	const pattern = new RegExp(`${PROTOCOL_START}[\\s\\S]*?${PROTOCOL_END}`);
	for (const file of INSTRUCTION_FILES) {
		const target = path.join(dir, file);
		if (!fs.existsSync(target)) {
			const source = INSTRUCTION_FILES.map((name) => path.join(dir, name)).find((candidate) => fs.existsSync(candidate));
			const sourceText = source ? fs.readFileSync(source, "utf8") : "";
			const guidelines = sourceText.match(BACKLOG_GUIDELINES);
			fs.writeFileSync(target, `${guidelines ? `${guidelines[0]}\n\n` : ""}${block}\n`);
			continue;
		}
		const current = fs.readFileSync(target, "utf8");
		const next = pattern.test(current) ? current.replace(pattern, () => block) : `${current.trimEnd()}\n\n${block}\n`;
		fs.writeFileSync(target, next);
	}
}

function buildInitArgs(project, prefix, isGit) {
	const args = ["init", project.name, "--defaults", "--task-prefix", prefix, "--include-remote", "false"];
	args.push("--agent-instructions", "agents,claude,gemini");
	if (!isGit) args.push("--no-git");
	return args;
}

async function initProject(id, body) {
	const prefix = typeof body.prefix === "string" ? body.prefix.trim().toLowerCase() : "";
	if (!/^[a-z]{1,10}$/.test(prefix) || RESERVED_PREFIXES.includes(prefix)) {
		throw new HttpError(400, "prefix must be 1-10 letters and not draft/doc/decision");
	}
	const project = findProject(readRegistry(), id);
	const info = inspectDirectory(project.path);
	if (!info.exists) throw new HttpError(400, "directory no longer exists");
	if (info.initialized) throw new HttpError(409, "Project already initialized");
	await runBacklog(project.path, buildInitArgs(project, prefix, info.isGit), 30000);
	applyProtocol(project.path);
	summaryCache.delete(id);
}

async function createSprint(id, body) {
	const name = typeof body.name === "string" ? body.name.trim() : "";
	if (!name || name.length > 80 || /[\r\n]/.test(name) || name.startsWith("-")) {
		throw new HttpError(400, "name must be 1-80 characters, one line, not starting with '-'");
	}
	const dueDate = typeof body.dueDate === "string" ? body.dueDate.trim() : "";
	if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) throw new HttpError(400, "dueDate must be YYYY-MM-DD");
	const project = findProject(readRegistry(), id);
	if (!inspectDirectory(project.path).initialized) throw new HttpError(409, "Project is not initialized");
	const args = ["milestone", "add", name];
	if (dueDate) args.push("--due-date", dueDate);
	try {
		await runBacklog(project.path, args, 15000);
	} catch (error) {
		throw new HttpError(400, error.message);
	}
	summaryCache.delete(id);
}

async function assignTask(id, body) {
	const taskId = typeof body.taskId === "string" ? body.taskId.trim() : "";
	if (!/^[A-Za-z]+-\d+(\.\d+)*$/.test(taskId)) throw new HttpError(400, "taskId is invalid");
	const sprintId = typeof body.sprintId === "string" ? body.sprintId.trim() : "";
	if (sprintId && !/^m-\d+$/.test(sprintId)) throw new HttpError(400, "sprintId must look like m-0, or be empty to clear");
	const project = findProject(readRegistry(), id);
	if (!inspectDirectory(project.path).initialized) throw new HttpError(409, "Project is not initialized");
	// `backlog task edit -m` accepts unknown milestones silently, so check the sprint exists first.
	if (sprintId && !(await listSprints(project)).some((sprint) => sprint.id === sprintId)) throw new HttpError(404, "Sprint not found");
	try {
		await runBacklog(project.path, ["task", "edit", taskId, ...(sprintId ? ["-m", sprintId] : ["--clear-milestone"])], 15000);
	} catch (error) {
		throw new HttpError(400, error.message);
	}
	summaryCache.delete(id);
}

function configFile(dir) {
	return CONFIG_CANDIDATES.map((rel) => path.join(dir, rel)).find((file) => fs.existsSync(file));
}

// Inline `statuses: ["To Do", ...]` is what `backlog init` writes; returns null for any other layout.
function statusesFromFile(dir) {
	const file = configFile(dir);
	const match = file && STATUSES_LINE.exec(fs.readFileSync(file, "utf8"));
	if (!match) return null;
	try {
		const list = JSON.parse(match[1]);
		return Array.isArray(list) && list.every((entry) => typeof entry === "string") ? list : null;
	} catch {
		return null;
	}
}

async function readStatuses(project) {
	const fromFile = statusesFromFile(project.path);
	if (fromFile && fromFile.length) return fromFile;
	const output = await runBacklog(project.path, ["config", "get", "statuses"], SUMMARY_TIMEOUT_MS);
	const statuses = output.trim().split(",").map((entry) => entry.trim()).filter(Boolean);
	if (!statuses.length) throw new Error("Could not read statuses from the backlog config");
	return statuses;
}

function requireInitialized(id) {
	const project = findProject(readRegistry(), id);
	if (!inspectDirectory(project.path).initialized) throw new HttpError(409, "Project is not initialized");
	return project;
}

async function loadBoard(id) {
	const project = requireInitialized(id);
	const [statuses, output] = await Promise.all([
		readStatuses(project),
		runBacklog(project.path, ["task", "list", "--json"], SUMMARY_TIMEOUT_MS),
	]);
	const tasks = JSON.parse(output).tasks || [];
	let sprints = [];
	let sprintsError = null;
	try {
		sprints = applyTaskCounts(await listSprints(project), tasks);
	} catch (error) {
		sprintsError = error.message;
	}
	return {
		project: { id: project.id, name: project.name },
		statuses,
		modelTiers: MODEL_TIERS,
		closedEnabled: statuses.some((status) => status.toLowerCase() === "closed"),
		tasks: tasks.map((task) => ({
			id: task.id,
			title: task.title,
			status: task.status,
			priority: task.priority,
			type: task.type,
			labels: task.labels || [],
			modelTier: MODEL_TIERS.find((tier) => (task.labels || []).includes(tier)) || null,
			assignees: task.assignees || [],
			milestone: task.milestone,
			dueDate: task.dueDate,
			updatedAt: task.updatedAt || task.createdAt || null,
		})),
		sprints,
		sprintsError,
	};
}

// Phase order follows the milestone id's numeric suffix (m-0, m-1, ...), which is Backlog.md's
// creation order; non-numeric ids (e.g. a renamed milestone) sort last.
function milestoneOrder(id) {
	const match = /^m-(\d+)$/.exec(id);
	return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

// Duration has no stored "phase started" date, so it is inferred from the earliest task in the
// phase. Actual end is the latest finished task's updatedAt (falling back to createdAt) once the
// phase is complete, or "now" while it is still open. Estimated end is the milestone due date, if
// one was set; without a due date, estimatedDays stays null per the metrics contract.
function phaseDuration(sprint, tasks) {
	const own = tasks.filter((task) => task.milestone === sprint.id);
	const createdTimes = own.map((task) => task.createdAt).filter(Boolean).map((value) => new Date(value).getTime());
	if (!createdTimes.length) return null;
	const startMs = Math.min(...createdTimes);
	const finishedTimes = own
		.filter((task) => FINISHED_STATUS.test(task.status))
		.map((task) => new Date(task.updatedAt || task.createdAt).getTime());
	const endMs = sprint.completed && finishedTimes.length ? Math.max(...finishedTimes) : Date.now();
	const estimatedDays = sprint.due ? Math.round(((new Date(`${sprint.due}T00:00:00Z`).getTime() - startMs) / 86400000) * 10) / 10 : null;
	return {
		startedAt: new Date(startMs).toISOString(),
		estimatedDays,
		actualDays: Math.round(((endMs - startMs) / 86400000) * 10) / 10,
		ongoing: !sprint.completed,
	};
}

// Phase metrics for reporting: per-phase velocity/duration/gate, a trend over the last 3 phases
// that have tickets, and an overall gate pass rate (approved vs rework) from phase-gates.json
// (see latestGateDecision). Reuses the same task/sprint data as loadBoard/loadSummary.
async function computePhaseMetrics(project) {
	const output = await runBacklog(project.path, ["task", "list", "--json"], SUMMARY_TIMEOUT_MS);
	const tasks = JSON.parse(output).tasks || [];
	const sprints = applyTaskCounts(await listSprints(project), tasks);
	const phases = sprints
		.slice()
		.sort((a, b) => milestoneOrder(a.id) - milestoneOrder(b.id))
		.map((sprint) => {
			const gate = latestGateDecision(project.path, sprint.id);
			return {
				milestoneId: sprint.id,
				phase: sprint.title,
				done: sprint.done,
				total: sprint.total,
				percent: sprint.total > 0 ? Math.round((sprint.done / sprint.total) * 1000) / 10 : null,
				completed: sprint.completed,
				dueDate: sprint.due,
				duration: phaseDuration(sprint, tasks),
				gate: gate ? { decision: gate.decision, date: gate.date || null, reviewer: gate.reviewer || null } : null,
			};
		});
	const withTickets = phases.filter((phase) => phase.total > 0);
	const gated = phases.filter((phase) => phase.gate);
	const approved = gated.filter((phase) => phase.gate.decision === "approved").length;
	const rework = gated.length - approved;
	return {
		phases,
		velocity: withTickets.map((phase) => ({ milestoneId: phase.milestoneId, phase: phase.phase, completed: phase.done, total: phase.total })),
		trend: withTickets.slice(-3).map((phase) => ({ milestoneId: phase.milestoneId, phase: phase.phase, percent: phase.percent, done: phase.done, total: phase.total })),
		gatePassRate: gated.length ? { approved, rework, percent: Math.round((approved / gated.length) * 1000) / 10 } : null,
		generatedAt: new Date().toISOString(),
	};
}

async function loadMetrics(id) {
	return computePhaseMetrics(requireInitialized(id));
}

function csvField(value) {
	if (value === null || value === undefined) return "";
	const text = String(value);
	return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function metricsToCsv(metrics) {
	const header = ["milestoneId", "phase", "done", "total", "percent", "completed", "dueDate", "startedAt", "estimatedDays", "actualDays", "ongoing", "gateDecision", "gateDate", "gateReviewer"];
	const rows = metrics.phases.map((phase) => [
		phase.milestoneId, phase.phase, phase.done, phase.total, phase.percent, phase.completed, phase.dueDate,
		phase.duration ? phase.duration.startedAt : "", phase.duration ? phase.duration.estimatedDays : "", phase.duration ? phase.duration.actualDays : "", phase.duration ? phase.duration.ongoing : "",
		phase.gate ? phase.gate.decision : "", phase.gate ? phase.gate.date : "", phase.gate ? phase.gate.reviewer : "",
	].map(csvField).join(","));
	return [header.join(","), ...rows].join("\n") + "\n";
}

async function loadMetricsCsv(id) {
	return metricsToCsv(await computePhaseMetrics(requireInitialized(id)));
}

async function moveTask(id, body) {
	const taskId = typeof body.taskId === "string" ? body.taskId.trim() : "";
	if (!/^[A-Za-z]+-\d+(\.\d+)*$/.test(taskId)) throw new HttpError(400, "taskId is invalid");
	const wanted = typeof body.status === "string" ? body.status.trim().toLowerCase() : "";
	const project = requireInitialized(id);
	const target = (await readStatuses(project)).find((status) => status.toLowerCase() === wanted);
	if (!target) throw new HttpError(400, "Unknown status");
	try {
		await runBacklog(project.path, ["task", "edit", taskId, "-s", target], 15000);
	} catch (error) {
		throw new HttpError(400, error.message);
	}
	summaryCache.delete(id);
}

// `backlog config set statuses` is refused by the CLI, which says to edit the config file directly.
function enableClosed(id) {
	const project = requireInitialized(id);
	const file = configFile(project.path);
	const text = fs.readFileSync(file, "utf8");
	const list = statusesFromFile(project.path);
	if (!list) throw new HttpError(409, "statuses in the backlog config is not an inline list; add \"Closed\" by hand");
	if (list.some((status) => status.toLowerCase() === "closed")) throw new HttpError(409, "Closed is already enabled");
	const next = `[${[...list, "Closed"].map((status) => JSON.stringify(status)).join(", ")}]`;
	const tmp = `${file}.${process.pid}.tmp`;
	fs.writeFileSync(tmp, text.replace(STATUSES_LINE, (full, current) => full.replace(current, next)));
	fs.renameSync(tmp, file);
	summaryCache.delete(id);
}

async function createTask(id, body) {
	const title = typeof body.title === "string" ? body.title.trim() : "";
	if (!title || title.length > 200 || /[\r\n]/.test(title) || title.startsWith("-")) {
		throw new HttpError(400, "title must be 1-200 characters, one line, not starting with '-'");
	}
	const sprintId = typeof body.sprintId === "string" ? body.sprintId.trim() : "";
	if (sprintId && !/^m-\d+$/.test(sprintId)) throw new HttpError(400, "sprintId must look like m-0");
	const modelTier = typeof body.modelTier === "string" ? body.modelTier.trim().toLowerCase() : "";
	if (!MODEL_TIERS.includes(modelTier)) throw new HttpError(400, `modelTier must be one of: ${MODEL_TIERS.join(", ")}`);
	const project = requireInitialized(id);
	if (sprintId && !(await listSprints(project)).some((sprint) => sprint.id === sprintId)) throw new HttpError(404, "Sprint not found");
	try {
		await runBacklog(project.path, ["task", "create", title, "-l", modelTier, ...(sprintId ? ["-m", sprintId] : [])], 15000);
	} catch (error) {
		throw new HttpError(400, error.message);
	}
	summaryCache.delete(id);
}

async function setTaskTier(id, body) {
	const taskId = typeof body.taskId === "string" ? body.taskId.trim() : "";
	if (!/^[A-Za-z]+-\d+(\.\d+)*$/.test(taskId)) throw new HttpError(400, "taskId is invalid");
	const modelTier = typeof body.modelTier === "string" ? body.modelTier.trim().toLowerCase() : "";
	if (!MODEL_TIERS.includes(modelTier)) throw new HttpError(400, `modelTier must be one of: ${MODEL_TIERS.join(", ")}`);
	const project = requireInitialized(id);
	try {
		const output = await runBacklog(project.path, ["task", "list", "--json"], SUMMARY_TIMEOUT_MS);
		const task = (JSON.parse(output).tasks || []).find((entry) => entry.id.toLowerCase() === taskId.toLowerCase());
		if (!task) throw new HttpError(404, "Task not found");
		const labels = task.labels || [];
		const remove = MODEL_TIERS.filter((tier) => tier !== modelTier && labels.includes(tier));
		const args = ["task", "edit", task.id];
		if (remove.length) args.push("--remove-label", remove.join(","));
		if (!labels.includes(modelTier)) args.push("--add-label", modelTier);
		if (args.length > 3) await runBacklog(project.path, args, 15000);
	} catch (error) {
		if (error instanceof HttpError) throw error;
		throw new HttpError(400, error.message);
	}
	summaryCache.delete(id);
}

function refreshProtocol(id) {
	const project = findProject(readRegistry(), id);
	if (!inspectDirectory(project.path).initialized) throw new HttpError(409, "Project is not initialized");
	applyProtocol(project.path);
}

async function route(method, pathname, body, query = new URLSearchParams()) {
	if (method === "GET" && pathname === "/api/projects") {
		const registry = readRegistry();
		return { projects: await Promise.all(registry.projects.map(describeProject)) };
	}
	if (method === "GET" && pathname === "/api/fs") return listDirectories(query.get("path"));
	if (method === "POST" && pathname === "/api/projects") return { project: await addProject(body) };
	const match = /^\/api\/projects\/([a-f0-9]{8})(?:\/(start|stop|init|sprints|assign|protocol|board|move|closed|tasks|tier|metrics))?$/.exec(pathname);
	if (!match) throw new HttpError(404, "Not found");
	const [, id, action] = match;
	if (method === "GET" && action === "board") return loadBoard(id);
	if (method === "GET" && action === "metrics") return loadMetrics(id);
	if (method === "DELETE" && !action) return removeProject(id).then(() => ({ ok: true }));
	if (method !== "POST" || !action) throw new HttpError(405, "Method not allowed");
	const registry = readRegistry();
	const project = findProject(registry, id);
	if (action === "start") {
		if (!inspectDirectory(project.path).initialized) throw new HttpError(409, "Project is not initialized");
		await startDashboard(registry, project);
	}
	if (action === "stop") await stopDashboard(project);
	if (action === "init") await initProject(id, body);
	if (action === "sprints") await createSprint(id, body);
	if (action === "assign") await assignTask(id, body);
	if (action === "protocol") refreshProtocol(id);
	if (action === "move") await moveTask(id, body);
	if (action === "closed") enableClosed(id);
	if (action === "tasks") await createTask(id, body);
	if (action === "tier") await setTaskTier(id, body);
	return { ok: true, url: `http://127.0.0.1:${project.port}/` };
}

function readBody(req) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		let size = 0;
		req.on("data", (chunk) => {
			size += chunk.length;
			if (size > 64 * 1024) {
				reject(new HttpError(413, "Body too large"));
				req.destroy();
				return;
			}
			chunks.push(chunk);
		});
		req.on("end", () => {
			if (!chunks.length) return resolve({});
			try {
				resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
			} catch {
				reject(new HttpError(400, "Invalid JSON"));
			}
		});
		req.on("error", reject);
	});
}

function assertLocalRequest(req) {
	const allowedHosts = [`127.0.0.1:${PORT}`, `localhost:${PORT}`];
	if (!allowedHosts.includes(req.headers.host || "")) throw new HttpError(403, "Forbidden host");
	if (req.method !== "GET" && req.method !== "HEAD") {
		const origin = req.headers.origin;
		if (!origin || !allowedHosts.some((host) => origin === `http://${host}`)) throw new HttpError(403, "Forbidden origin");
	}
}

function sendJson(res, status, payload) {
	const text = JSON.stringify(payload);
	res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
	res.end(text);
}
function sendProviderIcon(res, pathname) {
	const filename = PROVIDER_ICONS.get(pathname);
	if (!filename) return false;
	res.writeHead(200, {
		"content-type": "image/svg+xml; charset=utf-8",
		"cache-control": "no-store",
		"x-content-type-options": "nosniff",
	});
	res.end(fs.readFileSync(path.join(HERE, "assets", "providers", filename)));
	return true;
}


async function handle(req, res) {
	try {
		assertLocalRequest(req);
		const { pathname, searchParams } = new URL(req.url, `http://127.0.0.1:${PORT}`);
		if (req.method === "GET" && sendProviderIcon(res, pathname)) return;
		if (req.method === "GET" && pathname === "/") {
			res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
			res.end(fs.readFileSync(path.join(HERE, "index.html")));
			return;
		}
		const metricsMatch = req.method === "GET" && searchParams.get("format") === "csv" && /^\/api\/projects\/([a-f0-9]{8})\/metrics$/.exec(pathname);
		if (metricsMatch) {
			const csv = await loadMetricsCsv(metricsMatch[1]);
			res.writeHead(200, { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=\"phase-metrics.csv\"", "cache-control": "no-store" });
			res.end(csv);
			return;
		}
		const body = req.method === "GET" || req.method === "DELETE" ? {} : await readBody(req);
		sendJson(res, 200, await route(req.method, pathname, body, searchParams));
	} catch (error) {
		const status = error instanceof HttpError ? error.status : 500;
		sendJson(res, status, { error: error.message });
	}
}

function shutdown() {
	for (const child of children.values()) child.kill("SIGTERM");
	process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
http.createServer(handle).listen(PORT, "127.0.0.1", () => {
	console.log(`AI Hub: http://127.0.0.1:${PORT}`);
});
