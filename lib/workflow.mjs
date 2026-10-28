// Shared by the HTTP server and backlog-phase. Task writes always go through Backlog CLI.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

export var STATUSES = ['To Do', 'In Progress', 'Review', 'Done', 'Wontfix', 'Closed'];
var CONFIGS = ['backlog/config.yml', '.backlog/config.yml', 'backlog.config.yml'];
var PREFIX = 'AI-HUB-WORKFLOW ';
var META_LABELS = ['needs-review', 'review:ai', 'review:manual', 'review:approved', 'resolution:done', 'resolution:wontfix'];

export function delivered(task) {
  return /^done$/i.test(task.status) || (/^closed$/i.test(task.status) && (task.labels || []).indexOf('resolution:done') !== -1);
}

export function declined(task) {
  return /^wontfix$/i.test(task.status) || (/^closed$/i.test(task.status) && (task.labels || []).indexOf('resolution:wontfix') !== -1);
}

export function resolved(task) { return /^(done|wontfix|closed)$/i.test(task.status); }

export function workflowEnabled(statuses) {
  return STATUSES.every(function (status) { return statuses.some(function (s) { return s.toLowerCase() === status.toLowerCase(); }); });
}

export function configPath(cwd) {
  var rel = CONFIGS.filter(function (file) { return fs.existsSync(path.join(cwd, file)); })[0];
  if (!rel) throw new Error('Backlog config not found');
  return path.join(cwd, rel);
}

export function configStatuses(cwd) {
  var match = /^statuses:[ \t]*(\[[^\r\n]*\])/m.exec(fs.readFileSync(configPath(cwd), 'utf8'));
  if (!match) throw new Error('Workflow setup requires an inline statuses list; preserve your config and convert that field manually first.');
  // Backlog init uses double quotes; also accept a single-quoted simple YAML list.
  var list;
  try { list = JSON.parse(match[1].replace(/'([^']*)'/g, function (_, s) { return JSON.stringify(s); })); }
  catch (_) { throw new Error('Cannot parse statuses safely; no config was changed.'); }
  if (!Array.isArray(list) || !list.every(function (s) { return typeof s === 'string' && s.trim(); })) throw new Error('Invalid statuses list');
  return list;
}

// Same lock namespace as atomic claims. Never steal a lock from a live process.
export function withTaskLock(cwd, id, fn) {
  var root = process.env.AI_HUB_DATA_DIR || path.join(os.homedir(), '.config', 'ai-hub');
  var hash = crypto.createHash('sha256').update(fs.realpathSync(cwd)).digest('hex').slice(0, 12);
  var lock = path.join(root, 'locks', hash + '-' + id.toLowerCase().replace(/[^a-z0-9.-]/g, '-') + '.lock');
  fs.mkdirSync(path.dirname(lock), { recursive: true });
  try { fs.mkdirSync(lock); }
  catch (e) {
    if (e.code !== 'EEXIST') throw e;
    throw new Error('Ticket operation already in progress. Retry after it finishes; inspect stale locks before removing them.');
  }
  fs.writeFileSync(path.join(lock, 'owner.json'), JSON.stringify({ pid: process.pid, at: new Date().toISOString() }));
  function release() { fs.unlinkSync(path.join(lock, 'owner.json')); fs.rmdirSync(lock); }
  return Promise.resolve().then(fn).then(function (result) { release(); return result; }, function (error) { release(); throw error; });
}

export function migrateWorkflow(cwd, dryRun) {
  return withTaskLock(cwd, 'workflow-config', function () {
    var file = configPath(cwd);
    var before = fs.readFileSync(file, 'utf8');
    var old = configStatuses(cwd);
    var custom = old.filter(function (s) { return !STATUSES.some(function (standard) { return s.toLowerCase() === standard.toLowerCase(); }); });
    var next = STATUSES.slice(0, -1).concat(custom, ['Closed']);
    var changed = JSON.stringify(old) !== JSON.stringify(next);
    var result = { statuses: next, previous: old, changed: changed, dryRun: !!dryRun, backup: null };
    if (!changed || dryRun) return result;
    var backup = file + '.ai-hub-' + Date.now() + '.bak';
    fs.copyFileSync(file, backup, fs.constants.COPYFILE_EXCL);
    var text = before.replace(/^statuses:[ \t]*\[[^\r\n]*\]/m, 'statuses: ' + JSON.stringify(next));
    var tmp = file + '.ai-hub-' + process.pid + '.tmp';
    fs.writeFileSync(tmp, text);
    fs.renameSync(tmp, file);
    result.backup = backup;
    return result;
  });
}

export function workflowRecord(task) {
  var lines = (task.implementationNotes || '').split('\n');
  for (var i = lines.length - 1; i >= 0; i--) {
    if (lines[i].indexOf(PREFIX) !== 0) continue;
    try {
      var record = JSON.parse(lines[i].slice(PREFIX.length));
      if (record.version === 1 && record.to && record.at) return record;
    } catch (_) { /* ordinary or malformed notes never count as a workflow decision */ }
  }
  return null;
}

function required(value, field) {
  if (typeof value !== 'string' || !value.trim() || value.length > 4000) throw new Error(field + ' is required (1–4000 characters)');
  return value.trim();
}

export function transitionArgs(task, statuses, input) {
  var target = statuses.filter(function (s) { return s.toLowerCase() === String(input.status || '').toLowerCase(); })[0];
  if (!target) throw new Error('Unknown status');
  if (input.expectedStatus && input.expectedStatus.toLowerCase() !== task.status.toLowerCase()) throw new Error('Ticket changed since you opened it. Refresh and retry.');
  var from = task.status.toLowerCase();
  var to = target.toLowerCase();
  if (from === to) throw new Error('Ticket is already in ' + target);
  if (!workflowEnabled(statuses)) return ['task', 'edit', task.id, '-s', target];
  var labels = task.labels || [];
  var previous = workflowRecord(task);
  var record = { version: 1, from: task.status, to: target, at: new Date().toISOString(), mode: null, reviewer: null, decision: null, note: null, resolution: null };
  var add = [];
  var remove = META_LABELS.filter(function (l) { return labels.indexOf(l) !== -1; });
  if (to === 'review') {
    if (resolved(task)) throw new Error('Reopen to In Progress before requesting another review.');
    if (input.mode !== 'ai' && input.mode !== 'manual') throw new Error('Review mode must be ai or manual');
    record.mode = input.mode;
    record.reviewer = required(input.reviewer, 'Reviewer');
    record.note = required(input.note, 'Review handoff / evidence');
    record.decision = 'pending';
    add = ['needs-review', 'review:' + record.mode];
  } else if (to === 'done') {
    if (from !== 'review') throw new Error('Send the ticket to Review before marking Done.');
    if (input.mode !== 'ai' && input.mode !== 'manual') throw new Error('Review mode must be ai or manual');
    record.mode = input.mode;
    record.reviewer = required(input.reviewer, 'Reviewer');
    record.note = required(input.note, 'Review evidence');
    record.decision = 'approved';
    record.resolution = 'done';
    if (!(task.acceptanceCriteria || []).length || task.acceptanceCriteria.some(function (c) { return !c.checked; })) throw new Error('Done requires acceptance criteria with every item checked.');
    if ((task.definitionOfDone || []).some(function (c) { return !c.checked; })) throw new Error('Definition of Done has unchecked items.');
    add = ['review:' + record.mode, 'review:approved', 'resolution:done'];
  } else if (to === 'wontfix') {
    if (from === 'closed' || from === 'done') throw new Error('Reopen before changing the resolution to Wontfix.');
    record.note = required(input.note, 'Wontfix reason');
    record.resolution = 'wontfix';
    add = ['resolution:wontfix'];
  } else if (to === 'closed') {
    if (from !== 'done' && from !== 'wontfix') throw new Error('Closed requires Done or Wontfix first.');
    if (from === 'wontfix' && !(previous && previous.resolution === 'wontfix' && previous.note)) throw new Error('Wontfix is missing a recorded reason. Reopen and record it first.');
    record.resolution = from;
    record.note = from === 'wontfix' ? previous.note : (input.note || 'Ticket closed after accepted delivery.');
    record.mode = previous && previous.mode;
    record.reviewer = previous && previous.reviewer;
    record.decision = previous && previous.decision;
    add = ['resolution:' + from];
    if (from === 'done' && record.decision === 'approved') add = add.concat(['review:' + record.mode, 'review:approved']);
  } else if (from === 'review' || resolved(task)) {
    if (to !== 'in progress' && to !== 'to do') throw new Error('Reopen to To Do or In Progress.');
    record.note = required(input.note, from === 'review' ? 'Changes requested / withdrawal reason' : 'Reopen reason');
    record.decision = from === 'review' ? 'changes-requested' : 'reopened';
  }
  var args = ['task', 'edit', task.id, '-s', target];
  remove = remove.filter(function (label) { return add.indexOf(label) === -1; });
  if (remove.length) args.push('--remove-label', remove.join(','));
  if (add.length) args.push('--add-label', add.join(','));
  if (to === 'review') args.push('-a', record.reviewer);
  else if (to === 'to do') args.push('-a', '');
  args.push('--append-notes', PREFIX + JSON.stringify(record));
  if (to === 'done' || to === 'wontfix') args.push('--final-summary', record.note);
  return args;
}

export function moveWorkflow(cwd, id, input, run) {
  if (!/^[A-Za-z]+-\d+(?:\.\d+)*$/.test(id || '')) return Promise.reject(new Error('Invalid task id'));
  return Promise.resolve().then(function () { return withTaskLock(cwd, id, function () {
    return run(cwd, ['task', 'view', id, '--json'], 8000).then(function (output) {
      var before = JSON.parse(output).task;
      var args = transitionArgs(before, configStatuses(cwd), input);
      if (input.dryRun) return { dryRun: true, args: args };
      return run(cwd, args, 15000).then(function () {
        return run(cwd, ['task', 'view', id, '--json'], 8000);
      }).then(function (result) {
        var task = JSON.parse(result).task;
        if (task.status.toLowerCase() !== input.status.toLowerCase()) throw new Error('Status write verification failed');
        return { task: task.id, status: task.status, workflow: workflowRecord(task) };
      });
    });
  }); });
}

// Backlog 1.55 treats only Done as a satisfied dependency. AI Hub also recognizes
// explicitly delivered Closed tickets. Wontfix/legacy Closed never satisfy a dependency.
export function effectiveReadiness(detail, lookup) {
  var graph = detail.dependencyGraph;
  var nodes = graph ? graph.nodes.filter(function (n) { return n.dependencyDepth > 0; }) : [];
  var blocked = [];
  var failed = false;
  var ids = nodes.length ? nodes.map(function (n) { return n.id; }) : (detail.dependencies || []);
  return Promise.all(ids.map(function (id) {
    var node = nodes.filter(function (n) { return n.id === id; })[0];
    if (id === detail.id || (node && node.state !== 'resolved')) { blocked.push(id); failed = true; return null; }
    return Promise.resolve().then(function () { return lookup(id); }).then(function (task) {
      if (!task || !delivered(task)) blocked.push(id);
    }, function () { blocked.push(id); failed = true; });
  })).then(function () {
    // Fail closed for unknown/cyclic graphs without a usable dependency list.
    if (!ids.length && detail.isReady === false) failed = true;
    return { isReady: !blocked.length && !failed, blockedBy: blocked, blockedError: failed ? 'Dependency could not be resolved' : null };
  });
}
