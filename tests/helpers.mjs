import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { execFile, spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

export var root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function command(bin, args, cwd, env) {
  return new Promise(function (resolve, reject) {
    execFile(bin, args, { cwd: cwd, env: env || process.env, timeout: 30000, maxBuffer: 8 * 1024 * 1024 }, function (err, out, stderr) {
      if (err) reject(new Error(stderr || out || err.message)); else resolve(out);
    });
  });
}

export async function fixture() {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aihub-api-test-'));
  var repo = path.join(dir, 'project');
  fs.mkdirSync(repo);
  var socket = net.createServer();
  socket.listen(0, '127.0.0.1');
  await once(socket, 'listening');
  var port = socket.address().port;
  await new Promise(function (resolve) { socket.close(resolve); });
  var env = Object.assign({}, process.env, { PORT: String(port), AI_HUB_DATA_DIR: path.join(dir, 'registry') });
  var server = spawn(process.execPath, [path.join(root, 'server.mjs')], { cwd: root, env: env, stdio: ['ignore', 'pipe', 'pipe'] });
  var log = '';
  server.stderr.on('data', function (data) { log += data; });
  await new Promise(function (resolve, reject) {
    var timer = setTimeout(function () { reject(new Error('Server startup timed out: ' + log)); }, 10000);
    server.once('error', function (error) { clearTimeout(timer); reject(error); });
    server.once('exit', function () { clearTimeout(timer); reject(new Error('Server exited: ' + log)); });
    server.stdout.on('data', function (data) { if (String(data).indexOf('AI Hub:') !== -1) { clearTimeout(timer); resolve(); } });
  });
  var url = 'http://127.0.0.1:' + port;
  return {
    dir: dir, repo: repo, env: env, url: url,
    backlog: function (args) { return command(process.env.BACKLOG_BIN || 'backlog', args, repo, env); },
    phase: function (args) { return command(process.execPath, [path.join(root, 'bin/backlog-phase.mjs')].concat(args, ['--path', repo]), root, env); },
    api: async function (method, endpoint, body, expected) {
      var response = await fetch(url + endpoint, { method: method, headers: { origin: url, 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
      var result = await response.json();
      if (response.status !== (expected || 200)) throw new Error(method + ' ' + endpoint + ': ' + response.status + ' ' + JSON.stringify(result));
      return result;
    },
    cleanup: async function () {
      var exited = once(server, 'exit');
      server.kill('SIGTERM');
      await exited;
      // Only this explicitly created disposable fixture is removed.
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}
