/**
 * mailer.js — Servicio de email con Nodemailer + Gmail SMTP
 * Requiere MAIL_USER y MAIL_PASS en .env (App Password de Gmail)
 */
const nodemailer = require('nodemailer');

// Si no hay credenciales, usamos Ethereal (cuenta de prueba gratuita)
let HAS_MAIL = !!(process.env.MAIL_USER && process.env.MAIL_PASS);
let transporter = null;

async function initMailer() {
  if (HAS_MAIL) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS, // App Password de Gmail (no la contraseña normal)
      },
    });
    console.log(`✅ Email listo — ${process.env.MAIL_USER}`);
  } else {
    console.log('ℹ️  Email no configurado (MAIL_USER / MAIL_PASS vacíos). Creando cuenta de prueba Ethereal...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true para port 465, false para otros
        auth: {
          user: testAccount.user, // Generado por Ethereal
          pass: testAccount.pass, // Generado por Ethereal
        },
      });
      HAS_MAIL = true;
      process.env.MAIL_USER = testAccount.user; // Para el 'From'
      console.log(`✅ Ethereal Mail listo — ${testAccount.user}`);
    } catch (err) {
      console.error('❌ Error creando cuenta Ethereal:', err.message);
    }
  }
}

initMailer();

// ─── Plantilla base HTML ──────────────────────────────────────────────────────
function baseTemplate({ title, body, btnText, btnUrl }) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:#f5f3ff;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding:40px 16px;">
    <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,.08);">
      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:32px;text-align:center;">
        <h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">🎓 YourCourse</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,.75);font-size:13px;">${title}</p>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:32px 36px;">
        ${body}
      </td></tr>
      ${btnText && btnUrl ? `
      <!-- CTA -->
      <tr><td style="padding:0 36px 32px;text-align:center;">
        <a href="${btnUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;font-weight:700;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          ${btnText}
        </a>
      </td></tr>` : ''}
      <!-- Footer -->
      <tr><td style="padding:20px 36px;border-top:1px solid #f3f4f6;text-align:center;">
        <p style="margin:0;color:#9ca3af;font-size:11px;">
          Este email fue enviado por <strong>YourCourse</strong>.<br>
          Si no esperabas este mensaje, puedes ignorarlo.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

// ─── Función base de envío ────────────────────────────────────────────────────
async function sendMail({ to, subject, html }) {
  if (!HAS_MAIL) {
    console.log(`📧 [EMAIL OMITIDO] Para: ${to} | Asunto: ${subject}`);
    return;
  }
  try {
    const info = await transporter.sendMail({
      from: `"YourCourse 🎓" <${process.env.MAIL_USER || 'no-reply@yourcourse.mx'}>`,
      to, subject, html,
    });
    console.log(`✅ Email enviado → ${to}: ${subject}`);
    // Si estamos usando Ethereal, mostrar la URL para previsualizar el correo
    if (info.messageId && transporter.options.host === 'smtp.ethereal.email') {
      console.log(`👀 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (err) {
    console.error(`❌ Error al enviar email a ${to}:`, err.message);
  }
}

// ─── Templates específicos ────────────────────────────────────────────────────

/** Bienvenida al nuevo estudiante */
async function sendWelcomeEmail({ nombre, email }) {
  const html = baseTemplate({
    title: '¡Bienvenido/a a YourCourse!',
    body: `
      <h2 style="color:#1f2937;font-size:22px;margin:0 0 12px;">¡Hola, ${nombre}! 👋</h2>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Tu cuenta ha sido creada exitosamente en <strong>YourCourse</strong>.<br>
        Ya puedes explorar los cursos disponibles y empezar a aprender.
      </p>
      <div style="background:#f5f3ff;border-radius:12px;padding:16px;margin:0 0 16px;">
        <p style="margin:0;color:#7c3aed;font-size:13px;font-weight:600;">📧 Tu correo registrado:</p>
        <p style="margin:4px 0 0;color:#4b5563;font-size:14px;">${email}</p>
      </div>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">
        Si tienes alguna pregunta, contáctanos en <a href="mailto:soporte@yourcourse.mx" style="color:#7c3aed;">soporte@yourcourse.mx</a>
      </p>
    `,
    btnText: 'Ir a la plataforma',
    btnUrl:  'http://localhost:5173/login',
  });
  await sendMail({ to: email, subject: '¡Bienvenido/a a YourCourse! 🎓', html });
}

/** Notificación al creador: nuevo estudiante */
async function sendNewStudentAlert({ creadorEmail, estudianteNombre, estudianteEmail }) {
  const html = baseTemplate({
    title: 'Nuevo estudiante registrado',
    body: `
      <h2 style="color:#1f2937;font-size:20px;margin:0 0 12px;">🎉 ¡Tienes un nuevo estudiante!</h2>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Un nuevo usuario se ha registrado en tu plataforma <strong>YourCourse</strong>.
      </p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px;margin:0 0 16px;">
        <p style="margin:0;color:#15803d;font-weight:700;font-size:14px;">👨‍🎓 ${estudianteNombre}</p>
        <p style="margin:4px 0 0;color:#374151;font-size:13px;">${estudianteEmail}</p>
      </div>
      <p style="color:#6b7280;font-size:13px;margin:0;">Puedes verlo en el panel de <strong>Estudiantes</strong> de tu cuenta.</p>
    `,
    btnText: 'Ver estudiantes',
    btnUrl:  'http://localhost:5173/creator/estudiantes',
  });
  await sendMail({ to: creadorEmail, subject: `🎉 Nuevo estudiante: ${estudianteNombre}`, html });
}

/** Notificación al creador: nueva reseña/post en comunidad */
async function sendNewComunidadAlert({ creadorEmail, autorNombre, titulo, tipo }) {
  const emoji = tipo === 'resena' ? '⭐' : '💬';
  const tipoLabel = tipo === 'resena' ? 'reseña' : 'discusión';
  const html = baseTemplate({
    title: `Nueva ${tipoLabel} en Comunidad`,
    body: `
      <h2 style="color:#1f2937;font-size:20px;margin:0 0 12px;">${emoji} Nueva ${tipoLabel} publicada</h2>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 16px;">
        <strong>${autorNombre}</strong> ha publicado una ${tipoLabel} en la sección de Comunidad.
      </p>
      <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:12px;padding:16px;margin:0 0 16px;">
        <p style="margin:0;color:#7c3aed;font-size:13px;font-weight:600;">${tipoLabel.toUpperCase()}</p>
        <p style="margin:4px 0 0;color:#1f2937;font-size:15px;font-weight:700;">${titulo}</p>
      </div>
      <p style="color:#6b7280;font-size:13px;margin:0;">Revísala en el apartado de <strong>Comunidad</strong> de tu plataforma.</p>
    `,
    btnText: 'Ver Comunidad',
    btnUrl:  'http://localhost:5173/creator/comunidad',
  });
  await sendMail({ to: creadorEmail, subject: `${emoji} Nueva ${tipoLabel}: ${titulo.slice(0, 50)}`, html });
}

/** Notificación: nueva respuesta en un post */
async function sendNewReplyAlert({ destinatarioEmail, destinatarioNombre, autorNombre, postTitulo }) {
  const html = baseTemplate({
    title: 'Nueva respuesta en tu publicación',
    body: `
      <h2 style="color:#1f2937;font-size:20px;margin:0 0 12px;">💬 Tienes una nueva respuesta</h2>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Hola <strong>${destinatarioNombre}</strong>, <strong>${autorNombre}</strong> ha respondido en tu publicación:
      </p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin:0 0 16px;">
        <p style="margin:0;color:#1d4ed8;font-size:15px;font-weight:700;">"${postTitulo}"</p>
      </div>
      <p style="color:#6b7280;font-size:13px;margin:0;">Entra a la plataforma para ver la respuesta completa.</p>
    `,
    btnText: 'Ver respuesta',
    btnUrl:  'http://localhost:5173/creator/comunidad',
  });
  await sendMail({ to: destinatarioEmail, subject: `💬 ${autorNombre} respondió en tu post`, html });
}

/** Recuperación de contraseña */
async function sendPasswordResetEmail({ email, nombre, token }) {
  const resetUrl = `http://localhost:5173/reset-password?token=${token}`;
  const html = baseTemplate({
    title: 'Recuperación de contraseña',
    body: `
      <h2 style="color:#1f2937;font-size:22px;margin:0 0 12px;">¡Hola, ${nombre}! 👋</h2>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Recibimos una solicitud para restablecer tu contraseña en <strong>YourCourse</strong>.
      </p>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Haz clic en el siguiente botón para crear una nueva contraseña. Este enlace expira en 1 hora.
      </p>
    `,
    btnText: 'Restablecer contraseña',
    btnUrl:  resetUrl,
  });
  await sendMail({ to: email, subject: 'Recupera tu contraseña 🔐', html });
}

/** Verificación de Email */
async function sendVerificationEmail({ email, nombre, token }) {
  const verifyUrl = `http://localhost:5173/verify-email?token=${token}`;
  const html = baseTemplate({
    title: 'Verifica tu cuenta',
    body: `
      <h2 style="color:#1f2937;font-size:22px;margin:0 0 12px;">¡Hola, ${nombre}! 👋</h2>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Gracias por registrarte en <strong>YourCourse</strong>. Para empezar a usar la plataforma, necesitamos verificar tu correo electrónico.
      </p>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Haz clic en el siguiente botón para verificar tu cuenta.
      </p>
    `,
    btnText: 'Verificar correo',
    btnUrl:  verifyUrl,
  });
  await sendMail({ to: email, subject: 'Verifica tu cuenta de correo 📧', html });
}

/** Invitación a Curso Privado */
async function sendCourseInvitation({ email, cursoTitulo, inviteUrl }) {
  const html = baseTemplate({
    title: 'Invitación a curso privado',
    body: `
      <h2 style="color:#1f2937;font-size:22px;margin:0 0 12px;">¡Te han invitado a un curso! 🎉</h2>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 16px;">
        El creador del curso <strong>"${cursoTitulo}"</strong> te ha enviado una invitación exclusiva para unirte a su curso.
      </p>
      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Haz clic en el siguiente botón para aceptar la invitación y acceder al contenido.
      </p>
    `,
    btnText: 'Aceptar Invitación',
    btnUrl:  inviteUrl,
  });
  await sendMail({ to: email, subject: `Invitación exclusiva: ${cursoTitulo} 🎉`, html });
}

module.exports = { sendWelcomeEmail, sendNewStudentAlert, sendNewComunidadAlert, sendNewReplyAlert, sendPasswordResetEmail, sendVerificationEmail, sendCourseInvitation };
