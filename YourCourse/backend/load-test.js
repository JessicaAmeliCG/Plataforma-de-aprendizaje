/**
 * load-test.js — Prueba de carga para YourCourse Backend
 * Mide latencia y throughput en endpoints clave hasta encontrar fallos.
 */

const http = require('http');

const BASE = 'http://localhost:3000';
let TOKEN = '';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers,
    };

    const start = Date.now();
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const elapsed = Date.now() - start;
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), elapsed });
        } catch {
          resolve({ status: res.statusCode, body: data, elapsed });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function login() {
  const res = await request('POST', '/api/auth/login', {
    email: 'creador@yourcourse.mx',
    password: 'YourCourse2025!',
  });
  if (res.status === 200 && res.body.token) {
    TOKEN = res.body.token;
    console.log('✅ Login exitoso, token obtenido.\n');
  } else {
    console.error('❌ Error al hacer login:', res.body);
    process.exit(1);
  }
}

// ─── Test de Carga ────────────────────────────────────────────────────────────

async function runBatch(label, method, path, body, concurrency, useToken = true) {
  const results = { success: 0, fail: 0, errors: 0, latencies: [] };
  const promises = [];

  for (let i = 0; i < concurrency; i++) {
    const p = request(method, path, body, useToken ? TOKEN : null)
      .then((res) => {
        results.latencies.push(res.elapsed);
        if (res.status >= 200 && res.status < 300) results.success++;
        else if (res.status === 429) results.fail++; // Rate limited
        else results.fail++;
      })
      .catch(() => {
        results.errors++;
      });
    promises.push(p);
  }

  await Promise.all(promises);

  const sorted = results.latencies.sort((a, b) => a - b);
  const avg = sorted.length ? Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length) : 0;
  const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
  const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
  const max = sorted[sorted.length - 1] || 0;

  console.log(`📊 ${label} (${concurrency} req concurrentes)`);
  console.log(`   ✅ Exitosas: ${results.success}  |  ❌ Fallidas: ${results.fail}  |  💥 Errores red: ${results.errors}`);
  console.log(`   ⏱  Latencia: avg=${avg}ms  p50=${p50}ms  p95=${p95}ms  p99=${p99}ms  max=${max}ms`);
  console.log('');

  return results;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  YourCourse — Prueba de Carga y Estrés');
  console.log('═══════════════════════════════════════════════════════════════\n');

  await login();

  const levels = [10, 50, 100, 200, 300, 500];

  // 1. Health Check (endpoint sin auth, sin DB)
  console.log('── 1. Health Check (GET /api/health) ──────────────────────────');
  for (const n of levels) {
    const r = await runBatch('Health', 'GET', '/api/health', null, n, false);
    if (r.errors > 0) { console.log(`⛔ Fallos de red a ${n} concurrentes. Deteniendo.\n`); break; }
  }

  // 2. Login (POST - bcrypt es CPU-intensivo)
  console.log('── 2. Login (POST /api/auth/login) ────────────────────────────');
  for (const n of [10, 25, 50, 100, 150, 200]) {
    const r = await runBatch('Login', 'POST', '/api/auth/login', {
      email: 'creador@yourcourse.mx',
      password: 'YourCourse2025!',
    }, n, false);
    if (r.errors > 0) { console.log(`⛔ Fallos de red a ${n} concurrentes. Deteniendo.\n`); break; }
  }

  // 3. Cursos públicos (GET - lectura DB)
  console.log('── 3. Cursos Públicos (GET /api/cursos/publicos) ──────────────');
  for (const n of levels) {
    const r = await runBatch('Cursos Públicos', 'GET', '/api/cursos/publicos', null, n, false);
    if (r.errors > 0) { console.log(`⛔ Fallos de red a ${n} concurrentes. Deteniendo.\n`); break; }
  }

  // 4. Mis Cursos (GET - auth + lectura DB)
  console.log('── 4. Mis Cursos (GET /api/cursos) ────────────────────────────');
  for (const n of levels) {
    const r = await runBatch('Mis Cursos', 'GET', '/api/cursos', null, n);
    if (r.errors > 0) { console.log(`⛔ Fallos de red a ${n} concurrentes. Deteniendo.\n`); break; }
  }

  // 5. Perfil (GET - auth + lectura DB)
  console.log('── 5. Perfil (GET /api/auth/me) ──────────────────────────────');
  for (const n of levels) {
    const r = await runBatch('Perfil', 'GET', '/api/auth/me', null, n);
    if (r.errors > 0) { console.log(`⛔ Fallos de red a ${n} concurrentes. Deteniendo.\n`); break; }
  }

  // 6. Notificaciones (GET - auth + DB)
  console.log('── 6. Notificaciones (GET /api/notificaciones) ────────────────');
  for (const n of levels) {
    const r = await runBatch('Notificaciones', 'GET', '/api/notificaciones', null, n);
    if (r.errors > 0) { console.log(`⛔ Fallos de red a ${n} concurrentes. Deteniendo.\n`); break; }
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ✅ Prueba de carga completada.');
  console.log('═══════════════════════════════════════════════════════════════');
}

main().catch(console.error);
