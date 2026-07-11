/**
 * notif.js — Helper para crear notificaciones en BD + disparar emails
 * Compatible con base de datos dual asíncrona
 */
const db     = require('../config/db');
const mailer = require('./mailer');

/**
 * Crea una notificación en la BD para un usuario
 */
async function crearNotificacion({ usuarioId, tipo, titulo, mensaje = '', enlace = '' }) {
  try {
    await db.run(`
      INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, enlace)
      VALUES (?, ?, ?, ?, ?)
    `, usuarioId, tipo, titulo, mensaje, enlace);
  } catch (err) {
    console.error('Error creando notificación:', err.message);
  }
}

/** Obtiene el primer creador registrado */
async function getCreador() {
  return await db.get("SELECT * FROM usuarios WHERE rol = 'creador' LIMIT 1");
}

// ─── Disparadores de alto nivel ───────────────────────────────────────────────

/** Nuevo estudiante se registró */
async function onNuevoEstudiante(estudiante) {
  const creador = await getCreador();
  if (!creador) return;

  // Notificación en plataforma (para el creador si tiene notif_platform ON)
  if (creador.notif_platform !== 0) {
    await crearNotificacion({
      usuarioId: creador.id,
      tipo:    'nuevo_estudiante',
      titulo:  `Nuevo estudiante: ${estudiante.nombre}`,
      mensaje: `${estudiante.email} acaba de registrarse en la plataforma.`,
      enlace:  '/creator/estudiantes',
    });
  }

  // Email (si tiene notif_email ON)
  if (creador.notif_email !== 0) {
    await mailer.sendNewStudentAlert({
      creadorEmail:     creador.email,
      estudianteNombre: estudiante.nombre,
      estudianteEmail:  estudiante.email,
    });
  }

  // Siempre mandar bienvenida al estudiante
  await mailer.sendWelcomeEmail({ nombre: estudiante.nombre, email: estudiante.email });
}

/** Nuevo post en comunidad */
async function onNuevoPost(post, autor) {
  const creador = await getCreador();
  if (!creador || creador.id === autor.id) return; // No notificar si el creador es el autor

  const tipoLabel = post.tipo === 'resena' ? 'Nueva reseña' : 'Nueva discusión';

  if (creador.notif_platform !== 0) {
    await crearNotificacion({
      usuarioId: creador.id,
      tipo:    post.tipo === 'resena' ? 'nueva_resena' : 'nuevo_post',
      titulo:  `${tipoLabel}: ${post.titulo}`,
      mensaje: `${autor.nombre} publicó en la sección de Comunidad.`,
      enlace:  '/creator/comunidad',
    });
  }

  if (creador.notif_email !== 0) {
    await mailer.sendNewComunidadAlert({
      creadorEmail: creador.email,
      autorNombre:  autor.nombre,
      titulo:       post.titulo,
      tipo:         post.tipo,
    });
  }
}

/** Nueva respuesta en un post */
async function onNuevaRespuesta(post, autor, postAutor) {
  if (!postAutor || postAutor.id === autor.id) return; // No auto-notificar

  if (postAutor.notif_platform !== 0) {
    await crearNotificacion({
      usuarioId: postAutor.id,
      tipo:    'nueva_respuesta',
      titulo:  `${autor.nombre} respondió en tu post`,
      mensaje: `"${post.titulo}"`,
      enlace:  '/creator/comunidad',
    });
  }

  if (postAutor.notif_email !== 0) {
    await mailer.sendNewReplyAlert({
      destinatarioEmail:  postAutor.email,
      destinatarioNombre: postAutor.nombre,
      autorNombre:        autor.nombre,
      postTitulo:         post.titulo,
    });
  }

  // Si el post no es del creador, también notificar al creador
  const creador = await getCreador();
  if (creador && creador.id !== autor.id && creador.id !== postAutor.id) {
    if (creador.notif_platform !== 0) {
      await crearNotificacion({
        usuarioId: creador.id,
        tipo:    'nueva_respuesta',
        titulo:  `${autor.nombre} respondió en la comunidad`,
        mensaje: `En el post: "${post.titulo}"`,
        enlace:  '/creator/comunidad',
      });
    }
  }
}

module.exports = { crearNotificacion, onNuevoEstudiante, onNuevoPost, onNuevaRespuesta };
