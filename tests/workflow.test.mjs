import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { STATUSES, transitionArgs, delivered, declined, resolved, effectiveReadiness, migrateWorkflow, workflowRecord, moveWorkflow, withTaskLock } from '../lib/workflow.mjs';

function run(cwd, args, timeout) {
  return new Promise(function (resolve, reject) {
    execFile(process.env.BACKLOG_BIN || 'backlog', args, { cwd: cwd, timeout: timeout || 20000 }, function (error, stdout, stderr) {
      if (error) reject(new Error(stderr || stdout || error.message)); else resolve(stdout);
    });
  });
}
function base(status) { return { id: 'TEST-1', status: status, labels: [], acceptanceCriteria: [{ checked: true }], implementationNotes: '' }; }

test('resolution counters never turn Wontfix or legacy Closed into delivered work', function () {
  assert.equal(delivered(base('Done')), true);
  assert.equal(delivered(base('Wontfix')), false);
  assert.equal(resolved(base('Wontfix')), true);
  assert.equal(delivered(base('Closed')), false);
  assert.equal(declined(base('Closed')), false);
  assert.equal(delivered({ status: 'Closed', labels: ['resolution:done'] }), true);
  assert.equal(declined({ status: 'Closed', labels: ['resolution:wontfix'] }), true);
});

test('review and resolution constraints guard all status writes', function () {
  assert.throws(function () { transitionArgs(base('In Progress'), STATUSES, { status: 'Done' }); }, /Review/);
  assert.throws(function () { transitionArgs(base('In Progress'), STATUSES, { status: 'Review' }); }, /mode/);
  assert.throws(function () { transitionArgs(base('To Do'), STATUSES, { status: 'Wontfix', note: ' ' }); }, /reason/);
  assert.throws(function () { transitionArgs(base('Review'), STATUSES, { status: 'Closed' }); }, /Done or Wontfix/);
  var unchecked = base('Review'); unchecked.acceptanceCriteria[0].checked = false;
  assert.throws(function () { transitionArgs(unchecked, STATUSES, { status: 'Done', mode: 'manual', reviewer: 'Hue', note: 'UI reviewed' }); }, /criteria/);
  assert.throws(function () { transitionArgs(base('Closed'), STATUSES, { status: 'In Progress' }); }, /reason/);
  assert.throws(function () { transitionArgs(base('Review'), STATUSES, { status: 'In Progress', expectedStatus: 'To Do', note: 'retry' }); }, /changed/);
  assert.deepEqual(transitionArgs(base('In Progress'), ['To Do', 'In Progress', 'Done'], { status: 'Done' }), ['task', 'edit', 'TEST-1', '-s', 'Done']);
});

test('closed delivery satisfies dependencies, Wontfix and missing dependencies do not', async function () {
  var detail = { id: 'TEST-2', isReady: false, dependencies: ['TEST-1'] };
  assert.equal((await effectiveReadiness(detail, function () { return { status: 'Closed', labels: ['resolution:done'] }; })).isReady, true);
  assert.equal((await effectiveReadiness(detail, function () { return { status: 'Closed', labels: ['resolution:wontfix'] }; })).isReady, false);
  assert.equal((await effectiveReadiness(detail, function () { throw new Error('missing'); })).isReady, false);
});

test('real Backlog lifecycle, migration, audit notes and concurrent writes', async function (t) {
  var cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'aihub-workflow-test-'));
  // Fixture only: no real project task or registry is touched.
  t.after(function () { fs.rmSync(cwd, { recursive: true, force: true }); });
  await run(cwd, ['init', 'Workflow tests', '--defaults', '--no-git', '--task-prefix', 'TEST', '--include-remote', 'false', '--agent-instructions', 'none']);
  var config = path.join(cwd, 'backlog/config.yml');
  var original = fs.readFileSync(config, 'utf8');
  var preview = await migrateWorkflow(cwd, true);
  assert.equal(preview.changed, true);
  assert.equal(fs.readFileSync(config, 'utf8'), original);
  var migration = await migrateWorkflow(cwd, false);
  assert.equal(fs.readFileSync(migration.backup, 'utf8'), original);
  assert.equal((await migrateWorkflow(cwd, false)).changed, false);
  await run(cwd, ['task', 'create', 'Delivery <with literal HTML>', '-l', 'dev-medium', '--ac', 'Verified']);
  await run(cwd, ['task', 'create', 'Dependent', '-l', 'dev-medium', '--dep', 'TEST-1']);
  await moveWorkflow(cwd, 'TEST-1', { status: 'In Progress' }, run);
  await assert.rejects(moveWorkflow(cwd, 'TEST-1', { status: 'Done' }, run), /Review/);
  await moveWorkflow(cwd, 'TEST-1', { status: 'Review', mode: 'ai', reviewer: '@gpt-review', note: 'Tests and diff ready' }, run);
  var detail = JSON.parse(await run(cwd, ['task', 'view', 'TEST-1', '--json'])).task;
  assert.equal(detail.status, 'Review');
  assert.ok(detail.labels.includes('needs-review'));
  assert.equal(workflowRecord(detail).mode, 'ai');
  await assert.rejects(moveWorkflow(cwd, 'TEST-1', { status: 'Done', mode: 'ai', reviewer: '@gpt-review', note: 'Approved' }, run), /criteria/);
  await run(cwd, ['task', 'edit', 'TEST-1', '--check-ac', '1']);
  await moveWorkflow(cwd, 'TEST-1', { status: 'Done', mode: 'manual', reviewer: 'Hue', note: 'Manually verified acceptance criteria' }, run);
  detail = JSON.parse(await run(cwd, ['task', 'view', 'TEST-1', '--json'])).task;
  assert.ok(!detail.labels.includes('needs-review'));
  assert.ok(!detail.labels.includes('review:ai'));
  assert.ok(detail.labels.includes('review:manual'));
  assert.equal(workflowRecord(detail).decision, 'approved');
  await moveWorkflow(cwd, 'TEST-1', { status: 'Closed' }, run);
  detail = JSON.parse(await run(cwd, ['task', 'view', 'TEST-1', '--json'])).task;
  assert.equal(delivered(detail), true);
  var child = JSON.parse(await run(cwd, ['task', 'view', 'TEST-2', '--json'])).task;
  assert.equal((await effectiveReadiness(child, function () { return detail; })).isReady, true);
  await moveWorkflow(cwd, 'TEST-1', { status: 'In Progress', note: 'Scope changed' }, run);
  await assert.rejects(moveWorkflow(cwd, 'TEST-1', { status: 'Wontfix' }, run), /reason/);
  await moveWorkflow(cwd, 'TEST-1', { status: 'Wontfix', note: 'Replaced by a supported upstream solution.' }, run);
  await moveWorkflow(cwd, 'TEST-1', { status: 'Closed' }, run);
  detail = JSON.parse(await run(cwd, ['task', 'view', 'TEST-1', '--json'])).task;
  assert.equal(delivered(detail), false);
  assert.equal(declined(detail), true);
  assert.equal(workflowRecord(detail).note, 'Replaced by a supported upstream solution.');
  assert.ok(detail.implementationNotes.includes('Manually verified acceptance criteria'));
  child = JSON.parse(await run(cwd, ['task', 'view', 'TEST-2', '--json'])).task;
  assert.equal((await effectiveReadiness(child, function () { return detail; })).isReady, false);
  await withTaskLock(cwd, 'TEST-1', async function () {
    await assert.rejects(moveWorkflow(cwd, 'TEST-1', { status: 'In Progress', note: 'Race' }, run), /already in progress/);
  });
});

test('migration retains custom states and refuses unsupported YAML without changing bytes', async function (t) {
  var cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'aihub-config-test-'));
  t.after(function () { fs.rmSync(cwd, { recursive: true, force: true }); });
  fs.mkdirSync(path.join(cwd, 'backlog'));
  var file = path.join(cwd, 'backlog/config.yml');
  fs.writeFileSync(file, 'statuses: ["To Do", "Blocked", "Done"]\nproject_name: preserved\n');
  assert.ok((await migrateWorkflow(cwd, false)).statuses.includes('Blocked'));
  assert.ok(fs.readFileSync(file, 'utf8').includes('project_name: preserved'));
  var text = 'statuses:\n  - To Do\n  - Done\n';
  fs.writeFileSync(file, text);
  await assert.rejects(migrateWorkflow(cwd, false), /inline/);
  assert.equal(fs.readFileSync(file, 'utf8'), text);
});
