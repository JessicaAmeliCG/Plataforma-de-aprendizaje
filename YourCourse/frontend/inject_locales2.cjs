const fs = require('fs');
const dict = {
  'creator.colorViolet': { es: 'Violeta', en: 'Violet', pt: 'Violeta', fr: 'Violet' },
  'creator.colorBlue': { es: 'Azul', en: 'Blue', pt: 'Azul', fr: 'Bleu' },
  'creator.colorGreen': { es: 'Verde', en: 'Green', pt: 'Verde', fr: 'Vert' },
  'creator.colorPink': { es: 'Rosa', en: 'Pink', pt: 'Rosa', fr: 'Rose' },
  'creator.colorAmber': { es: 'Ámbar', en: 'Amber', pt: 'Âmbar', fr: 'Ambre' },
  'creator.colorIndigo': { es: 'Índigo', en: 'Indigo', pt: 'Índigo', fr: 'Indigo' },
  'creator.modelFree': { es: 'Gratuito', en: 'Free', pt: 'Gratuito', fr: 'Gratuit' },
  'creator.modelFreeDesc': { es: 'Sin costo para los estudiantes', en: 'No cost for students', pt: 'Sem custo para os alunos', fr: 'Sans frais pour les étudiants' },
  'creator.modelOneTime': { es: 'Pago único', en: 'One-time payment', pt: 'Pagamento único', fr: 'Paiement unique' },
  'creator.modelOneTimeDesc': { es: 'Los estudiantes pagan una vez', en: 'Students pay once', pt: 'Os alunos pagam uma vez', fr: 'Les étudiants paient une fois' },
  'creator.modelSub': { es: 'Suscripción mensual', en: 'Monthly subscription', pt: 'Assinatura mensal', fr: 'Abonnement mensuel' },
  'creator.modelSubDesc': { es: 'Cobro mensual recurrente', en: 'Recurring monthly charge', pt: 'Cobrança mensal recorrente', fr: 'Frais mensuels récurrents' },
  'creator.courseTitlePlaceholder': { es: 'Título del curso…', en: 'Course title...', pt: 'Título do curso...', fr: 'Titre du cours...' },
  'creator.courseDescPlaceholder': { es: 'Descripción del curso…', en: 'Course description...', pt: 'Descrição do curso...', fr: 'Description du cours...' },
  'creator.titleRequired': { es: 'El título es obligatorio.', en: 'Title is required.', pt: 'O título é obrigatório.', fr: 'Le titre est requis.' },
  'creator.courseCreated': { es: '¡Curso creado!', en: 'Course created!', pt: 'Curso criado!', fr: 'Cours créé !' },
  'creator.redirectingCourses': { es: 'Redirigiendo a tus cursos…', en: 'Redirecting to your courses...', pt: 'Redirecionando para seus cursos...', fr: 'Redirection vers vos cours...' },
  'creator.fillDetailsPreview': { es: 'Completa los detalles y previsualiza tu tarjeta en tiempo real.', en: 'Fill in the details and preview your card in real-time.', pt: 'Preencha os detalhes e visualize seu cartão em tempo real.', fr: 'Remplissez les détails et prévisualisez votre carte en temps réel.' },
  'creator.basicInfo': { es: 'Información básica', en: 'Basic information', pt: 'Informação básica', fr: 'Informations de base' },
  'creator.courseTitle': { es: 'Título del curso', en: 'Course title', pt: 'Título do curso', fr: 'Titre du cours' },
  'creator.courseTitleEx': { es: 'Ej. React Avanzado con Hooks y Context', en: 'E.g., Advanced React with Hooks and Context', pt: 'Ex. React Avançado com Hooks e Context', fr: 'Ex. React avancé avec Hooks et Context' },
  'creator.description': { es: 'Descripción', en: 'Description', pt: 'Descrição', fr: 'Description' },
  'creator.courseDescHint': { es: 'Describe qué aprenderán tus estudiantes.', en: 'Describe what your students will learn.', pt: 'Descreva o que seus alunos aprenderão.', fr: 'Décrivez ce que vos étudiants apprendront.' },
  'creator.courseDescEx': { es: 'Domina los conceptos más avanzados de...', en: 'Master the most advanced concepts of...', pt: 'Domine os conceitos mais avançados de...', fr: 'Maîtrisez les concepts les plus avancés de...' },
  'creator.modules': { es: 'Módulos', en: 'Modules', pt: 'Módulos', fr: 'Modules' },
  'creator.modulesNumberHint': { es: 'Número de módulos del curso', en: 'Number of modules in the course', pt: 'Número de módulos no curso', fr: 'Nombre de modules dans le cours' },
  'creator.estimatedDuration': { es: 'Duración estimada', en: 'Estimated duration', pt: 'Duração estimada', fr: 'Durée estimée' },
  'creator.durationEx': { es: 'Ej: 10h 30m', en: 'E.g.: 10h 30m', pt: 'Ex: 10h 30m', fr: 'Ex: 10h 30m' },
  'creator.monetization': { es: 'Monetización', en: 'Monetization', pt: 'Monetização', fr: 'Monétisation' },
  'creator.monthlyPrice': { es: 'Precio mensual (MXN)', en: 'Monthly price (MXN)', pt: 'Preço mensal (MXN)', fr: 'Prix mensuel (MXN)' },
  'creator.price': { es: 'Precio (MXN)', en: 'Price (MXN)', pt: 'Preço (MXN)', fr: 'Prix (MXN)' },
  'creator.cardColor': { es: 'Color de la tarjeta', en: 'Card color', pt: 'Cor do cartão', fr: 'Couleur de la carte' },
  'creator.publishState': { es: 'Estado de publicación', en: 'Publication status', pt: 'Status de publicação', fr: 'Statut de publication' },
  'creator.saveAsDraft': { es: 'Guardar como borrador', en: 'Save as draft', pt: 'Salvar como rascunho', fr: 'Enregistrer comme brouillon' },
  'creator.notVisibleStudents': { es: 'No visible para estudiantes', en: 'Not visible to students', pt: 'Não visível para os alunos', fr: 'Non visible pour les étudiants' },
  'creator.publishNow': { es: 'Publicar ahora', en: 'Publish now', pt: 'Publicar agora', fr: 'Publier maintenant' },
  'creator.visibleAll': { es: 'Visible para todos', en: 'Visible to everyone', pt: 'Visível para todos', fr: 'Visible pour tous' },
  'creator.creatingCourse': { es: 'Creando curso...', en: 'Creating course...', pt: 'Criando curso...', fr: 'Création du cours...' },
  'creator.publishCourse': { es: 'Publicar curso', en: 'Publish course', pt: 'Publicar curso', fr: 'Publier le cours' },
  'creator.saveDraft': { es: 'Guardar borrador', en: 'Save draft', pt: 'Salvar rascunho', fr: 'Enregistrer le brouillon' },
  'creator.cardPreview': { es: 'Vista previa de la tarjeta', en: 'Card preview', pt: 'Visualização do cartão', fr: 'Aperçu de la carte' },
  'creator.howStudentsWillSee': { es: 'Así verán tu curso los estudiantes', en: 'This is how students will see your course', pt: 'Assim que os alunos verão o seu curso', fr: 'Voici comment les étudiants verront votre cours' }
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
