const fs = require('fs');

const dict = {
  "creator.retry": { "es": "Reintentar", "en": "Retry", "pt": "Tentar novamente", "fr": "Réessayer" },
  "creator.analyticsTitle": { "es": "Analíticas", "en": "Analytics", "pt": "Análises", "fr": "Analytique" },
  "creator.analyticsDesc": { "es": "Estadísticas detalladas de ingresos, alumnos y comprensión de tus cursos.", "en": "Detailed statistics on revenue, students, and comprehension for your courses.", "pt": "Estatísticas detalhadas sobre receita, alunos e compreensão de seus cursos.", "fr": "Statistiques détaillées sur les revenus, les étudiants et la compréhension de vos cours." },
  "creator.coursesCreated": { "es": "Cursos creados", "en": "Courses created", "pt": "Cursos criados", "fr": "Cours créés" },
  "creator.publishedWord": { "es": "publicados", "en": "published", "pt": "publicados", "fr": "publiés" },
  "creator.onPlatform": { "es": "En la plataforma", "en": "On the platform", "pt": "Na plataforma", "fr": "Sur la plateforme" },
  "creator.totalEnrollmentsSub": { "es": "Total de inscripciones", "en": "Total enrollments", "pt": "Total de inscrições", "fr": "Total des inscriptions" },
  "creator.estimatedRevenue": { "es": "Ingresos estimados", "en": "Estimated revenue", "pt": "Receita estimada", "fr": "Revenus estimés" },
  "creator.mxnAccumulated": { "es": "MXN acumulado", "en": "MXN accumulated", "pt": "MXN acumulado", "fr": "MXN cumulé" },
  "creator.revenueByCourse": { "es": "Ingresos por Curso", "en": "Revenue by Course", "pt": "Receita por Curso", "fr": "Revenus par cours" },
  "creator.estimatedRevenueDesc": { "es": "Estimado: precio × inscripciones", "en": "Estimated: price × enrollments", "pt": "Estimado: preço × inscrições", "fr": "Estimé : prix × inscriptions" },
  "creator.noPaidCoursesEnrolled": { "es": "Sin cursos de pago con inscripciones", "en": "No paid courses with enrollments", "pt": "Nenhum curso pago com inscrições", "fr": "Aucun cours payant avec inscriptions" },
  "creator.studentsByCourse": { "es": "Alumnos por Curso", "en": "Students by Course", "pt": "Alunos por Curso", "fr": "Étudiants par cours" },
  "creator.enrollmentsByCourse": { "es": "Número de inscripciones por curso", "en": "Number of enrollments per course", "pt": "Número de inscrições por curso", "fr": "Nombre d'inscriptions par cours" },
  "creator.noEnrollmentsYet": { "es": "Aún no hay inscripciones", "en": "No enrollments yet", "pt": "Nenhuma inscrição ainda", "fr": "Aucune inscription pour le moment" },
  "creator.studentsSuffix": { "es": " alumnos", "en": " students", "pt": " alunos", "fr": " étudiants" },
  "creator.comprehensionByCourse": { "es": "Comprensión por Curso", "en": "Comprehension by Course", "pt": "Compreensão por Curso", "fr": "Compréhension par cours" },
  "creator.avgRatingDesc": { "es": "Calificación promedio según reseñas de estudiantes", "en": "Average rating based on student reviews", "pt": "Classificação média com base nas avaliações dos alunos", "fr": "Note moyenne basée sur les avis des étudiants" },
  "creator.noCourseReviewsYet": { "es": "Aún no hay reseñas de cursos", "en": "No course reviews yet", "pt": "Nenhuma avaliação de curso ainda", "fr": "Aucun avis sur le cours pour le moment" },
  "creator.reviewsWillAppearHere": { "es": "Las reseñas de estudiantes aparecerán aquí como indicador de comprensión.", "en": "Student reviews will appear here as an indicator of comprehension.", "pt": "As avaliações dos alunos aparecerão aqui como um indicador de compreensão.", "fr": "Les avis des étudiants apparaîtront ici comme indicateur de compréhension." },
  "creator.monthlyActivity": { "es": "Actividad Mensual", "en": "Monthly Activity", "pt": "Atividade Mensal", "fr": "Activité mensuelle" },
  "creator.enrollmentsPerMonth": { "es": "Inscripciones por mes (últimos 6 meses)", "en": "Enrollments per month (last 6 months)", "pt": "Inscrições por mês (últimos 6 meses)", "fr": "Inscriptions par mois (6 derniers mois)" },
  "creator.noActivityYet": { "es": "Aún no hay actividad registrada", "en": "No activity recorded yet", "pt": "Nenhuma atividade registrada ainda", "fr": "Aucune activité enregistrée pour le moment" },
  "creator.enrollmentsSuffix": { "es": " inscripciones", "en": " enrollments", "pt": " inscrições", "fr": " inscriptions" },
  "creator.courseSummary": { "es": "Resumen por Curso", "en": "Course Summary", "pt": "Resumo do Curso", "fr": "Résumé du cours" },
  "creator.courseHeader": { "es": "Curso", "en": "Course", "pt": "Curso", "fr": "Cours" },
  "creator.statusHeader": { "es": "Estado", "en": "Status", "pt": "Status", "fr": "Statut" },
  "creator.studentsHeader": { "es": "Alumnos", "en": "Students", "pt": "Alunos", "fr": "Étudiants" },
  "creator.priceHeader": { "es": "Precio", "en": "Price", "pt": "Preço", "fr": "Prix" },
  "creator.estRevenueHeader": { "es": "Ingresos Est.", "en": "Est. Revenue", "pt": "Receita Est.", "fr": "Revenus est." },
  "creator.ratingHeader": { "es": "Rating", "en": "Rating", "pt": "Rating", "fr": "Note" }
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
