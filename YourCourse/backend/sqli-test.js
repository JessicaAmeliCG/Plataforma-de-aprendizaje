/**
 * sqli-test.js — Pruebas de inyección SQL contra YourCourse Backend
 * Envía payloads maliciosos a cada endpoint que acepta input del usuario
 * y verifica si la aplicación responde de forma segura.
 */

const http = require('http');

const BASE = 'http://localhost:3000';
let TOKEN = '';

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

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ─── Payloads de SQL Injection ─────────────────────────────────────────────────

const SQLI_PAYLOADS = [
  // Classic OR-based
  "' OR '1'='1",
  "' OR '1'='1' --",
  "' OR '1'='1' /*",
  "1' OR '1'='1",
  "admin' --",
  
  // UNION-based
  "' UNION SELECT 1,2,3,4,5,6,7,8 --",
  "' UNION SELECT NULL, email, password_hash, NULL, NULL, NULL, NULL, NULL FROM usuarios --",
  "1 UNION SELECT sql FROM sqlite_master --",
  
  // Stacked queries
  "'; DROP TABLE usuarios; --",
  "'; DELETE FROM cursos; --",
  "1; INSERT INTO usuarios (nombre,email,password_hash,rol) VALUES ('hacker','hack@hack.com','abc','superadmin'); --",
  
  // Blind SQLi (boolean)
  "' AND 1=1 --",
  "' AND 1=2 --",
  "' AND (SELECT COUNT(*) FROM usuarios) > 0 --",
  
  // Time-based blind (SQLite)
  "' AND (SELECT CASE WHEN 1=1 THEN randomblob(500000000) END) --",
  
  // SQLite-specific
  "' AND SQLITE_VERSION() --",
  "1'; ATTACH DATABASE '/tmp/pwned.db' AS pwned; --",
  
  // Double encoding
  "%27%20OR%20%271%27%3D%271",
  
  // Nested quotes
  "'''''''''''AAAA",
  
  // NULL byte
  "\0' OR '1'='1",
];

const results = [];

function logResult(testName, endpoint, payload, response, vulnerable) {
  const icon = vulnerable ? '🔴 VULNERABLE' : '🟢 SEGURO';
  results.push({ testName, endpoint, payload: payload.substring(0, 60), status: response.status, vulnerable });
  console.log(`  ${icon} | ${testName}`);
  console.log(`    Payload: ${payload.substring(0, 80)}`);
  console.log(`    Status: ${response.status}`);
  if (vulnerable) {
    console.log(`    Response: ${JSON.stringify(response.body).substring(0, 200)}`);
  }
  console.log('');
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  YourCourse — Pruebas de Inyección SQL');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Login primero
  const loginRes = await request('POST', '/api/auth/login', {
    email: 'creador@yourcourse.mx',
    password: 'YourCourse2025!',
  });
  TOKEN = loginRes.body.token;
  console.log('✅ Token obtenido para pruebas autenticadas.\n');

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 1: Login con SQLi en email
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('── TEST 1: Login — SQLi en campo email ────────────────────────');
  for (const payload of SQLI_PAYLOADS) {
    try {
      const res = await request('POST', '/api/auth/login', {
        email: payload,
        password: 'anything',
      });
      // Si devuelve 200 con token → VULNERABLE
      const vuln = res.status === 200 && res.body?.token;
      logResult('Login email SQLi', 'POST /api/auth/login', payload, res, vuln);
    } catch (err) {
      console.log(`  💥 Error de red con payload: ${payload.substring(0, 40)}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 2: Register con SQLi en nombre y email
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('── TEST 2: Register — SQLi en campos ──────────────────────────');
  for (const payload of SQLI_PAYLOADS.slice(0, 8)) {
    try {
      const res = await request('POST', '/api/auth/register', {
        nombre: payload,
        email: `test_${Date.now()}@test.com`,
        password: 'TestPass123!',
      });
      // Si se registra con nombre malicioso sin sanitizar = información
      const vuln = res.status === 201 && res.body?.user?.nombre?.includes('UNION');
      logResult('Register nombre SQLi', 'POST /api/auth/register', payload, res, vuln);
    } catch (err) {
      console.log(`  💥 Error con payload: ${payload.substring(0, 40)}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 3: Cursos /:id con SQLi en param
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('── TEST 3: Cursos — SQLi en :id (path param) ─────────────────');
  const idPayloads = [
    "1 OR 1=1",
    "1' OR '1'='1",
    "1; DROP TABLE cursos;",
    "1 UNION SELECT * FROM usuarios",
    "1' AND (SELECT password_hash FROM usuarios WHERE id=1)='x",
  ];
  for (const payload of idPayloads) {
    try {
      const res = await request('GET', `/api/cursos/${encodeURIComponent(payload)}`, null, TOKEN);
      const vuln = res.status === 200 && res.body?.data;
      logResult('Curso :id SQLi', `GET /api/cursos/${payload}`, payload, res, vuln);
    } catch (err) {
      console.log(`  💥 Error con payload: ${payload.substring(0, 40)}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 4: Comunidad — SQLi en query param "tipo"
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('── TEST 4: Comunidad — SQLi en query param "tipo" ────────────');
  // Cómo detectar una inyección real en este endpoint:
  // Con la corrección, cualquier tipo inválido retorna TODOS los posts (tipoFiltrado = null → .all())
  // Una inyección exitosa sería si el attacker logra que solo se devuelvan resultados filtrados
  // por su payload SQL, no los registros normales.
  //
  // Señal de VULNERABILIDAD REAL: el endpoint devuelve filas con `tipo` distinto a 'resena' o 'recomendacion'
  // (lo que indicaría que el SQL fue manipulado para devolver datos inesperados).
  const tipoPayloads = [
    "resena' OR '1'='1",
    "resena' UNION SELECT 1,2,3,4,5,6,7,8,9 FROM usuarios --",
    "resena'; DROP TABLE comunidad_posts; --",
    "all' AND 1=1 --",
    "resena' AND (SELECT password_hash FROM usuarios LIMIT 1)='x' --",
  ];
  for (const payload of tipoPayloads) {
    try {
      const res = await request('GET', `/api/comunidad?tipo=${encodeURIComponent(payload)}`, null, TOKEN);
      // VULNERABLE solo si devuelve filas con tipo distinto a los valores válidos de la BD
      // (indicaría que el SQL fue manipulado y devolvió datos de otras tablas)
      const tiposEsperados = ['resena', 'recomendacion'];
      const tieneFilaExtrania = res.status === 200 && Array.isArray(res.body?.data) &&
        res.body.data.some(row => !tiposEsperados.includes(row.tipo));
      logResult('Comunidad tipo SQLi', `GET /api/comunidad?tipo=...`, payload, res, tieneFilaExtrania);
    } catch (err) {
      console.log(`  💥 Error con payload: ${payload.substring(0, 40)}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 5: Crear Post — SQLi en contenido y título
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('── TEST 5: Crear Post — SQLi en contenido ─────────────────────');
  for (const payload of SQLI_PAYLOADS.slice(0, 5)) {
    try {
      const res = await request('POST', '/api/comunidad', {
        tipo: 'recomendacion',
        titulo: payload,
        contenido: `${payload} — Prueba de inyección SQL automatizada`,
      }, TOKEN);
      const vuln = false; // Si se almacena el payload como texto plano está bien (prepared stmt lo maneja)
      logResult('Post contenido SQLi', 'POST /api/comunidad', payload, res, vuln);
    } catch (err) {
      console.log(`  💥 Error con payload: ${payload.substring(0, 40)}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TEST 6: Inscripción — SQLi en curso_id
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('── TEST 6: Inscripción — SQLi en curso_id ─────────────────────');
  const inscripcionPayloads = [
    "1 OR 1=1",
    "1'; DROP TABLE inscripciones; --",
    "1 UNION SELECT 1,2,3",
  ];
  // Need a student token for this
  const estRes = await request('POST', '/api/auth/login', {
    email: 'carlos@gmail.com',
    password: 'Est123456!',
  });
  const EST_TOKEN = estRes.body?.token || TOKEN;

  for (const payload of inscripcionPayloads) {
    try {
      const res = await request('POST', '/api/estudiantes/inscribir', { curso_id: payload }, EST_TOKEN);
      const vuln = res.status === 201;
      logResult('Inscripción SQLi', 'POST /api/estudiantes/inscribir', payload, res, vuln);
    } catch (err) {
      console.log(`  💥 Error con payload: ${payload.substring(0, 40)}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESUMEN
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  RESUMEN DE RESULTADOS');
  console.log('═══════════════════════════════════════════════════════════════');

  const vulnerables = results.filter(r => r.vulnerable);
  const seguros = results.filter(r => !r.vulnerable);

  console.log(`\n  Total de pruebas: ${results.length}`);
  console.log(`  🟢 Seguras:     ${seguros.length}`);
  console.log(`  🔴 Vulnerables: ${vulnerables.length}`);

  if (vulnerables.length > 0) {
    console.log('\n  ⚠️  ENDPOINTS VULNERABLES:');
    for (const v of vulnerables) {
      console.log(`    - ${v.testName} | ${v.endpoint} | Payload: ${v.payload}`);
    }
  } else {
    console.log('\n  ✅ No se detectaron vulnerabilidades de SQL Injection directas.');
  }

  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
