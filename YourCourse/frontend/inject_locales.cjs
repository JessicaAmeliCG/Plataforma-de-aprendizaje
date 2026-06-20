const fs = require('fs');
const dict = {
  'creator.viewManage': { es: 'Ver y gestionar', en: 'View and manage', pt: 'Ver e gerenciar', fr: 'Voir et gérer' },
  'creator.studentsLower': { es: 'alumnos', en: 'students', pt: 'alunos', fr: 'étudiants' },
  'creator.viewLessons': { es: 'Ver lecciones →', en: 'View lessons →', pt: 'Ver aulas →', fr: 'Voir les leçons →' },
  'creator.noResults': { es: 'Sin resultados', en: 'No results', pt: 'Sem resultados', fr: 'Aucun résultat' },
  'creator.noCoursesYet': { es: 'Aún no tienes cursos', en: 'You have no courses yet', pt: 'Ainda não tem cursos', fr: 'Vous n\'avez pas encore de cours' },
  'creator.noCoursesMatch': { es: 'No encontramos cursos que coincidan con', en: 'We found no courses matching', pt: 'Não encontramos cursos correspondentes a', fr: 'Nous n\'avons trouvé aucun cours correspondant à' },
  'creator.createFirstCourseDesc': { es: 'Crea tu primer curso y empieza a compartir tu conocimiento.', en: 'Create your first course and start sharing your knowledge.', pt: 'Crie seu primeiro curso e comece a compartilhar seu conhecimento.', fr: 'Créez votre premier cours et commencez à partager vos connaissances.' },
  'creator.createFirstCourse': { es: 'Crear primer curso', en: 'Create first course', pt: 'Criar primeiro curso', fr: 'Créer le premier cours' },
  'creator.manageCoursesDesc': { es: 'Gestiona tus cursos, sube videos y organiza el contenido.', en: 'Manage your courses, upload videos, and organize content.', pt: 'Gerencie seus cursos, envie vídeos e organize o conteúdo.', fr: 'Gérez vos cours, téléversez des vidéos et organisez le contenu.' },
  'creator.createCourse': { es: 'Crear Curso', en: 'Create Course', pt: 'Criar Curso', fr: 'Créer un cours' },
  'creator.totalStudents': { es: 'Total alumnos', en: 'Total students', pt: 'Total de alunos', fr: 'Total des étudiants' },
  'creator.searchCoursePlaceholder': { es: 'Buscar curso por título...', en: 'Search course by title...', pt: 'Buscar curso por título...', fr: 'Rechercher un cours par titre...' }
};

const langs = ['es', 'en', 'pt', 'fr'];
langs.forEach(lang => {
  let file = './src/locales/' + lang + '.js';
  let content = fs.readFileSync(file, 'utf8');
  let newEntries = '';
  for (const key in dict) {
    if (!content.includes(`'${key}':`)) {
      newEntries += `  '${key}': '${dict[key][lang]}',\n`;
    }
  }
  if (newEntries) {
    content = content.replace(/\n\s+\/\/ Notifications/g, '\n' + newEntries + '\n  // Notifications');
    fs.writeFileSync(file, content);
  }
});
