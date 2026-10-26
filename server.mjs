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

function summarizeTasks(tasks) {
	const counts = {};
	const inProgress = [];
	for (const task of tasks) {
		counts[task.status] = (counts[task.status] || 0) + 1;
		if (/progress/i.test(task.status)) {
			inProgress.push({ id: task.id, title: task.title, priority: task.priority });
		}
	}
	return { counts, total: tasks.length, inProgress };
}

async function loadSummary(project) {
	const cached = summaryCache.get(project.id);
	if (cached && Date.now() - cached.at < SUMMARY_TTL_MS) return cached.value;
	let value;
	try {
		const output = await runBacklog(project.path, ["task", "list", "--json"], SUMMARY_TIMEOUT_MS);
		value = summarizeTasks(JSON.parse(output).tasks || []);
	} catch (error) {
		value = { error: error.message };
	}
	summaryCache.set(project.id, { at: Date.now(), value });
	return value;
}

async function describeProject(project) {
	const info = inspectDirectory(project.path);
	const running = info.exists && (await isPortOpen(project.port));
	const summary = info.initialized ? await loadSummary(project) : null;
	return { ...project, ...info, running, url: `http://127.0.0.1:${project.port}/`, summary };
}

function validateProjectPath(rawPath) {
	if (typeof rawPath !== "string" || !rawPath.trim()) throw new HttpError(400, "path is required");
	const expanded = rawPath.trim().replace(/^~(?=$|\/)/, os.homedir());
	if (!path.isAbsolute(expanded)) throw new HttpError(400, "path must be absolute");
	if (!inspectDirectory(expanded).exists) throw new HttpError(400, "directory does not exist");
	return fs.realpathSync(expanded);
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
	const template = fs.readFileSync(path.join(HERE, "templates", "agent-protocol.md"), "utf8").trim();
	const block = `${PROTOCOL_START}\n${template}\n${PROTOCOL_END}`;
	const pattern = new RegExp(`${PROTOCOL_START}[\\s\\S]*?${PROTOCOL_END}`);
	for (const file of ["AGENTS.md", "CLAUDE.md"]) {
		const target = path.join(dir, file);
		if (!fs.existsSync(target)) continue;
		const current = fs.readFileSync(target, "utf8");
		const next = pattern.test(current) ? current.replace(pattern, () => block) : `${current.trimEnd()}\n\n${block}\n`;
		fs.writeFileSync(target, next);
	}
}

function buildInitArgs(project, prefix, isGit) {
	const args = ["init", project.name, "--defaults", "--task-prefix", prefix, "--include-remote", "false"];
	args.push("--agent-instructions", "agents,claude");
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

async function route(method, pathname, body) {
	if (method === "GET" && pathname === "/api/projects") {
		const registry = readRegistry();
		return { projects: await Promise.all(registry.projects.map(describeProject)) };
	}
	if (method === "POST" && pathname === "/api/projects") return { project: await addProject(body) };
	const match = /^\/api\/projects\/([a-f0-9]{8})(?:\/(start|stop|init))?$/.exec(pathname);
	if (!match) throw new HttpError(404, "Not found");
	const [, id, action] = match;
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

async function handle(req, res) {
	try {
		assertLocalRequest(req);
		const { pathname } = new URL(req.url, `http://127.0.0.1:${PORT}`);
		if (req.method === "GET" && pathname === "/") {
			res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
			res.end(fs.readFileSync(path.join(HERE, "index.html")));
			return;
		}
		const body = req.method === "GET" || req.method === "DELETE" ? {} : await readBody(req);
		sendJson(res, 200, await route(req.method, pathname, body));
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
