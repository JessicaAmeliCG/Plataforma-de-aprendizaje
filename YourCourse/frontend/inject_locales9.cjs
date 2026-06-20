const fs = require('fs');

const dict = {
  "roles.creador": { "es": "🎓 Creador", "en": "🎓 Creator", "pt": "🎓 Criador", "fr": "🎓 Créateur" },
  "roles.estudiante": { "es": "👨‍🎓 Estudiante", "en": "👨‍🎓 Student", "pt": "👨‍🎓 Estudante", "fr": "👨‍🎓 Étudiant" },
  "roles.maestro": { "es": "🏫 Maestro", "en": "🏫 Teacher", "pt": "🏫 Professor", "fr": "🏫 Enseignant" },
  "roles.apoyo": { "es": "🤝 Apoyo", "en": "🤝 Support", "pt": "🤝 Apoio", "fr": "🤝 Soutien" },
  "roles.super_usuario": { "es": "⚡ Super Usuario", "en": "⚡ Super User", "pt": "⚡ Super Usuário", "fr": "⚡ Super Utilisateur" },
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
