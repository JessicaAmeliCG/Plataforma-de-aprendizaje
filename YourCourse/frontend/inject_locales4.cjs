const fs = require('fs');

const dict = {
  "creator.coursesWord": { "es": "cursos", "en": "courses", "pt": "cursos", "fr": "cours" },
  "creator.registrationWord": { "es": "registro", "en": "registration", "pt": "registro", "fr": "inscription" },
  "creator.noCoursesEnrolledYet": { "es": "Sin cursos inscritos aún.", "en": "No enrolled courses yet.", "pt": "Nenhum curso inscrito ainda.", "fr": "Aucun cours inscrit pour le moment." },
  "creator.enrolledCourses": { "es": "Cursos inscritos", "en": "Enrolled courses", "pt": "Cursos inscritos", "fr": "Cours inscrits" },
  "creator.enrolledOn": { "es": "Inscrito el", "en": "Enrolled on", "pt": "Inscrito em", "fr": "Inscrit le" },
  "creator.freeCaps": { "es": "GRATIS", "en": "FREE", "pt": "GRÁTIS", "fr": "GRATUIT" },
  "creator.subsCaps": { "es": "SUSCR.", "en": "SUBS.", "pt": "ASSIN.", "fr": "ABON." },
  "creator.paidCaps": { "es": "PAGO", "en": "PAID", "pt": "PAGO", "fr": "PAYANT" },
  "creator.studentsTitle": { "es": "Estudiantes", "en": "Students", "pt": "Estudantes", "fr": "Étudiants" },
  "creator.registeredStudentsWord": { "es": "estudiantes registrados", "en": "registered students", "pt": "estudantes registrados", "fr": "étudiants inscrits" },
  "creator.totalEnrollmentsWord": { "es": "inscripciones totales", "en": "total enrollments", "pt": "inscrições totais", "fr": "inscriptions totales" },
  "creator.update": { "es": "Actualizar", "en": "Update", "pt": "Atualizar", "fr": "Mettre à jour" },
  "creator.totalRegistered": { "es": "Total registrados", "en": "Total registered", "pt": "Total registrados", "fr": "Total inscrits" },
  "creator.withActiveCourses": { "es": "Con cursos activos", "en": "With active courses", "pt": "Com cursos ativos", "fr": "Avec cours actifs" },
  "creator.enrollments": { "es": "Inscripciones", "en": "Enrollments", "pt": "Inscrições", "fr": "Inscriptions" },
  "creator.searchNameEmail": { "es": "Buscar por nombre o email…", "en": "Search by name or email…", "pt": "Buscar por nome ou e-mail…", "fr": "Rechercher par nom ou e-mail…" },
  "creator.loadingStudents": { "es": "Cargando estudiantes…", "en": "Loading students…", "pt": "Carregando estudantes…", "fr": "Chargement des étudiants…" },
  "creator.noSearchResults": { "es": "Sin resultados para tu búsqueda", "en": "No results for your search", "pt": "Sem resultados para sua busca", "fr": "Aucun résultat pour votre recherche" },
  "creator.noStudentsYet": { "es": "Aún no hay estudiantes registrados", "en": "No registered students yet", "pt": "Nenhum estudante registrado ainda", "fr": "Aucun étudiant inscrit pour le moment" }
};

const langs = ['es', 'en', 'pt', 'fr'];
langs.forEach(lang => {
  let file = './src/locales/' + lang + '.js';
  let content = fs.readFileSync(file, 'utf8');
  let newEntries = '';
  for (const key in dict) {
    if (!content.includes(`'${key}':`)) {
      newEntries += `  '${key}': "${dict[key][lang].replace(/"/g, '\\"')}",\n`;
    }
  }
  if (newEntries) {
    content = content.replace(/\n\s+\/\/ Notifications/g, '\n' + newEntries + '\n  // Notifications');
    fs.writeFileSync(file, content);
  }
});
