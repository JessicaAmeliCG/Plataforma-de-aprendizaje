const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, '../backend/data/yourcourse.db'));

db.prepare("UPDATE usuarios SET nombre = 'Jessica Castro' WHERE email = 'creador@yourcourse.mx'").run();

const u = db.prepare("SELECT id, nombre, email, rol FROM usuarios WHERE email = 'creador@yourcourse.mx'").get();
console.log('✅ Nombre actualizado:', JSON.stringify(u));
