const fs = require('fs');

const dict = {
  "creator.justNow": { "es": "Hace un momento", "en": "Just now", "pt": "Agora mesmo", "fr": "À l'instant" },
  "creator.minsAgo": { "es": "Hace {m} min", "en": "{m} mins ago", "pt": "Há {m} min", "fr": "Il y a {m} min" },
  "creator.hoursAgo": { "es": "Hace {h}h", "en": "{h}h ago", "pt": "Há {h}h", "fr": "Il y a {h}h" },
  "creator.daysAgo": { "es": "Hace {d} días", "en": "{d} days ago", "pt": "Há {d} dias", "fr": "Il y a {d} jours" },
  "creator.creatorRole": { "es": "Creador", "en": "Creator", "pt": "Criador", "fr": "Créateur" },
  "creator.repliesCount": { "es": "respuesta", "en": "reply", "pt": "resposta", "fr": "réponse" },
  "creator.repliesCountPlural": { "es": "respuestas", "en": "replies", "pt": "respostas", "fr": "réponses" },
  "creator.replyPlaceholder": { "es": "Responder...", "en": "Reply...", "pt": "Responder...", "fr": "Répondre..." },
  "creator.noTitle": { "es": "Sin título", "en": "No title", "pt": "Sem título", "fr": "Sans titre" },
  "creator.relatedTo": { "es": "Relacionado con:", "en": "Related to:", "pt": "Relacionado a:", "fr": "Lié à :" },
  "creator.replyDiscussionPlaceholder": { "es": "Responder a esta discusión...", "en": "Reply to this discussion...", "pt": "Responder a esta discussão...", "fr": "Répondre à cette discussion..." },
  "creator.newReview": { "es": "Nueva Reseña", "en": "New Review", "pt": "Nova Avaliação", "fr": "Nouvel avis" },
  "creator.yourRating": { "es": "Tu calificación", "en": "Your rating", "pt": "Sua classificação", "fr": "Votre note" },
  "creator.reviewTitleEx": { "es": "Título de tu reseña (opcional)", "en": "Review title (optional)", "pt": "Título da sua avaliação (opcional)", "fr": "Titre de votre avis (facultatif)" },
  "creator.reviewDescEx": { "es": "Comparte tu experiencia con la plataforma...", "en": "Share your experience with the platform...", "pt": "Compartilhe sua experiência com a plataforma...", "fr": "Partagez votre expérience avec la plateforme..." },
  "creator.publishReview": { "es": "Publicar reseña", "en": "Publish review", "pt": "Publicar avaliação", "fr": "Publier l'avis" },
  "creator.contentRequired": { "es": "El contenido es obligatorio.", "en": "Content is required.", "pt": "O conteúdo é obrigatório.", "fr": "Le contenu est obligatoire." },
  "creator.titleContentRequired": { "es": "Título y contenido son obligatorios.", "en": "Title and content are required.", "pt": "Título e conteúdo são obrigatórios.", "fr": "Le titre et le contenu sont obligatoires." },
  "creator.newDiscussion": { "es": "Nueva Discusión", "en": "New Discussion", "pt": "Nova Discussão", "fr": "Nouvelle discussion" },
  "creator.discussionTitleEx": { "es": "Título de tu pregunta o recomendación *", "en": "Title of your question or recommendation *", "pt": "Título da sua pergunta ou recomendação *", "fr": "Titre de votre question ou recommandation *" },
  "creator.discussionDescEx": { "es": "Describe tu problema o recomendación...", "en": "Describe your problem or recommendation...", "pt": "Descreva seu problema ou recomendação...", "fr": "Décrivez votre problème ou recommandation..." },
  "creator.tagsEx": { "es": "Tags: React, Docker, SQL (separados por comas)", "en": "Tags: React, Docker, SQL (comma-separated)", "pt": "Tags: React, Docker, SQL (separados por vírgula)", "fr": "Mots-clés : React, Docker, SQL (séparés par des virgules)" },
  "creator.publishBtn": { "es": "Publicar", "en": "Publish", "pt": "Publicar", "fr": "Publier" },
  "creator.communityTitle": { "es": "Comunidad", "en": "Community", "pt": "Comunidade", "fr": "Communauté" },
  "creator.communityDesc": { "es": "Reseñas de la plataforma y foro de recomendaciones entre estudiantes.", "en": "Platform reviews and student recommendation forum.", "pt": "Avaliações da plataforma e fórum de recomendações entre estudantes.", "fr": "Avis sur la plateforme et forum de recommandations entre étudiants." },
  "creator.cancelBtn": { "es": "Cancelar", "en": "Cancel", "pt": "Cancelar", "fr": "Annuler" },
  "creator.newPostBtn": { "es": "Nueva publicación", "en": "New post", "pt": "Nova publicação", "fr": "Nouvelle publication" },
  "creator.reviewsTab": { "es": "Reseñas", "en": "Reviews", "pt": "Avaliações", "fr": "Avis" },
  "creator.avgRatingTab": { "es": "Calificación avg", "en": "Avg Rating", "pt": "Classificação média", "fr": "Note moyenne" },
  "creator.discussionsTab": { "es": "Discusiones", "en": "Discussions", "pt": "Discussões", "fr": "Discussions" },
  "creator.forumDiscussionsTab": { "es": "Foro / Discusiones", "en": "Forum / Discussions", "pt": "Fórum / Discussões", "fr": "Forum / Discussions" },
  "creator.deletePostConfirm": { "es": "¿Eliminar esta publicación?", "en": "Delete this post?", "pt": "Excluir esta publicação?", "fr": "Supprimer cette publication ?" },
  "creator.noReviewsYet": { "es": "Aún no hay reseñas", "en": "No reviews yet", "pt": "Nenhuma avaliação ainda", "fr": "Aucun avis pour le moment" },
  "creator.studentsWillRate": { "es": "Los estudiantes podrán calificar y opinar sobre la plataforma.", "en": "Students will be able to rate and review the platform.", "pt": "Os alunos poderão avaliar e opinar sobre a plataforma.", "fr": "Les étudiants pourront évaluer et donner leur avis sur la plateforme." },
  "creator.noDiscussionsYet": { "es": "Aún no hay discusiones", "en": "No discussions yet", "pt": "Nenhuma discussão ainda", "fr": "Aucune discussion pour le moment" },
  "creator.studentsWillAsk": { "es": "Los estudiantes podrán hacer preguntas y recomendaciones aquí.", "en": "Students will be able to ask questions and make recommendations here.", "pt": "Os alunos poderão fazer perguntas e recomendações aqui.", "fr": "Les étudiants pourront poser des questions et faire des recommandations ici." },
  "creator.publishFirst": { "es": "Publica el primero →", "en": "Publish the first one →", "pt": "Publique a primeira →", "fr": "Publiez le premier →" }
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
