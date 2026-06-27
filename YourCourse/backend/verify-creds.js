const db = require('./src/config/db');

const usuarios = db.prepare('SELECT id, nombre, email, rol FROM usuarios').all();
console.table(usuarios);
