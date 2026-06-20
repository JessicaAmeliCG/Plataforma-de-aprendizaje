const fs = require('fs');
const dict = {
  'creator.badgePublished': { es: '● Publicado', en: '● Published', pt: '● Publicado', fr: '● Publié' },
  'creator.badgeDraft': { es: '○ Borrador', en: '○ Draft', pt: '○ Rascunho', fr: '○ Brouillon' },
  'creator.rename': { es: 'Renombrar', en: 'Rename', pt: 'Renomear', fr: 'Renommer' },
  'creator.videoUploaded': { es: 'Video cargado', en: 'Video uploaded', pt: 'Vídeo carregado', fr: 'Vidéo téléversée' },
  'creator.noVideo': { es: 'Sin video', en: 'No video', pt: 'Sem vídeo', fr: 'Aucune vidéo' },
  'creator.title': { es: 'Título', en: 'Title', pt: 'Título', fr: 'Titre' },
  'creator.lessonTitleEx': { es: 'ej. Introducción al tema', en: 'e.g., Introduction to the topic', pt: 'ex. Introdução ao tema', fr: 'ex. Introduction au sujet' },
  'creator.dragOrSelectVideo': { es: 'Arrastra o selecciona un video', en: 'Drag or select a video', pt: 'Arraste ou selecione um vídeo', fr: 'Faites glisser ou sélectionnez une vidéo' },
  'creator.videoFormatsMax': { es: 'MP4, WebM, MOV, MKV · Máx. 2 GB', en: 'MP4, WebM, MOV, MKV · Max. 2 GB', pt: 'MP4, WebM, MOV, MKV · Máx. 2 GB', fr: 'MP4, WebM, MOV, MKV · Max. 2 Go' },
  'creator.uploading': { es: 'Subiendo...', en: 'Uploading...', pt: 'Enviando...', fr: 'Téléversement...' },
  'creator.addLesson': { es: 'Agregar lección', en: 'Add lesson', pt: 'Adicionar aula', fr: 'Ajouter une leçon' },
  'creator.descOptional': { es: 'Descripción (opcional)', en: 'Description (optional)', pt: 'Descrição (opcional)', fr: 'Description (facultatif)' },
  'creator.exerciseTitleEx': { es: 'ej. Ejercicio 1 — Algoritmos básicos', en: 'e.g., Exercise 1 — Basic algorithms', pt: 'ex. Exercício 1 — Algoritmos básicos', fr: 'ex. Exercice 1 — Algorithmes de base' },
  'creator.exerciseDescEx': { es: 'Breve descripción del ejercicio', en: 'Brief description of the exercise', pt: 'Breve descrição do exercício', fr: "Brève description de l'exercice" },
  'creator.dragOrSelectFile': { es: 'Arrastra o selecciona el archivo', en: 'Drag or select the file', pt: 'Arraste ou selecione o arquivo', fr: 'Faites glisser ou sélectionnez le fichier' },
  'creator.fileFormatsMax': { es: 'PDF, Word, PowerPoint, TXT · Máx. 100 MB', en: 'PDF, Word, PowerPoint, TXT · Max. 100 MB', pt: 'PDF, Word, PowerPoint, TXT · Máx. 100 MB', fr: 'PDF, Word, PowerPoint, TXT · Max. 100 Mo' },
  'creator.addExercise': { es: 'Agregar ejercicio', en: 'Add exercise', pt: 'Adicionar exercício', fr: 'Ajouter un exercice' },
  'creator.confirmDeleteLesson': { es: '¿Eliminar esta lección? El video se borrará permanentemente.', en: 'Delete this lesson? The video will be permanently deleted.', pt: 'Excluir esta aula? O vídeo será permanentemente excluído.', fr: 'Supprimer cette leçon ? La vidéo sera définitivement supprimée.' },
  'creator.confirmDeleteExercise': { es: '¿Eliminar este ejercicio? El archivo se borrará permanentemente.', en: 'Delete this exercise? The file will be permanently deleted.', pt: 'Excluir este exercício? O arquivo será permanentemente excluído.', fr: 'Supprimer cet exercice ? Le fichier sera définitivement supprimé.' },
  'creator.courseNotFound': { es: 'Curso no encontrado.', en: 'Course not found.', pt: 'Curso não encontrado.', fr: 'Cours non trouvé.' },
  'creator.back': { es: 'Volver', en: 'Back', pt: 'Voltar', fr: 'Retour' },
  'creator.contentManagement': { es: 'Gestión de contenido', en: 'Content management', pt: 'Gestão de conteúdo', fr: 'Gestion du contenu' },
  'creator.takeClass': { es: 'Tomar clase', en: 'Take class', pt: 'Fazer aula', fr: 'Suivre le cours' },
  'creator.lessons': { es: 'Lecciones', en: 'Lessons', pt: 'Aulas', fr: 'Leçons' },
  'creator.exercises': { es: 'Ejercicios', en: 'Exercises', pt: 'Exercícios', fr: 'Exercices' },
  'creator.studentsWord': { es: 'Alumnos', en: 'Students', pt: 'Alunos', fr: 'Étudiants' },
  'creator.noLessons': { es: 'Sin lecciones', en: 'No lessons', pt: 'Sem aulas', fr: 'Aucune leçon' },
  'creator.addFirstVideo': { es: 'Agrega tu primer video para empezar.', en: 'Add your first video to get started.', pt: 'Adicione seu primeiro vídeo para começar.', fr: 'Ajoutez votre première vidéo pour commencer.' },
  'creator.preview': { es: 'Previsualización', en: 'Preview', pt: 'Visualização', fr: 'Aperçu' },
  'creator.close': { es: 'Cerrar', en: 'Close', pt: 'Fechar', fr: 'Fermer' },
  'creator.addNewLesson': { es: 'Agregar nueva lección', en: 'Add new lesson', pt: 'Adicionar nova aula', fr: 'Ajouter une nouvelle leçon' },
  'creator.tip': { es: 'Tip', en: 'Tip', pt: 'Dica', fr: 'Astuce' },
  'creator.reorderTip': { es: 'Usa ▲ ▼ para reordenar. Haz clic en el ▶ para previsualizar. Los cambios se guardan automáticamente.', en: 'Use ▲ ▼ to reorder. Click ▶ to preview. Changes are saved automatically.', pt: 'Use ▲ ▼ para reordenar. Clique em ▶ para visualizar. As alterações são salvas automaticamente.', fr: 'Utilisez ▲ ▼ pour réorganiser. Cliquez sur ▶ pour prévisualiser. Les modifications sont enregistrées automatiquement.' },
  'creator.exercisesMaterial': { es: 'Ejercicios y Material de Apoyo', en: 'Exercises and Support Material', pt: 'Exercícios e Material de Apoio', fr: 'Exercices et matériel de support' },
  'creator.noExercises': { es: 'Sin ejercicios', en: 'No exercises', pt: 'Sem exercícios', fr: 'Aucun exercice' },
  'creator.uploadPdfsDesc': { es: 'Sube PDFs, presentaciones o documentos de apoyo.', en: 'Upload PDFs, presentations, or support documents.', pt: 'Envie PDFs, apresentações ou documentos de apoio.', fr: 'Téléversez des PDF, des présentations ou des documents de support.' },
  'creator.uploadNewExercise': { es: 'Subir nuevo ejercicio', en: 'Upload new exercise', pt: 'Enviar novo exercício', fr: 'Téléverser un nouvel exercice' },
  'creator.supportedFormats': { es: 'Formatos soportados', en: 'Supported formats', pt: 'Formatos suportados', fr: 'Formats pris en charge' },
  'creator.studentsCanDownload': { es: 'Los estudiantes podrán descargar estos archivos como material complementario de cada lección.', en: 'Students will be able to download these files as complementary material for each lesson.', pt: 'Os alunos poderão baixar esses arquivos como material complementar de cada aula.', fr: 'Les étudiants pourront télécharger ces fichiers comme matériel complémentaire pour chaque leçon.' }
};

const langs = ['es', 'en', 'pt', 'fr'];
langs.forEach(lang => {
  let file = './src/locales/' + lang + '.js';
  let content = fs.readFileSync(file, 'utf8');
  let newEntries = '';
  for (const key in dict) {
    if (!content.includes(`'${key}':`)) {
      newEntries += `  '${key}': '${dict[key][lang].replace(/'/g, "\\'")}',\n`;
    }
  }
  if (newEntries) {
    content = content.replace(/\n\s+\/\/ Notifications/g, '\n' + newEntries + '\n  // Notifications');
    fs.writeFileSync(file, content);
  }
});
