const fs = require('fs');

const dict = {
  "roles.superadmin": { "es": "⚡ Super Usuario", "en": "⚡ Super User", "pt": "⚡ Super Usuário", "fr": "⚡ Super Utilisateur" },
  "roles.moderador": { "es": "🤝 Apoyo/Ayudante", "en": "🤝 Support/Assistant", "pt": "🤝 Apoio/Assistente", "fr": "🤝 Soutien/Assistant" },
  "roles.creador": { "es": "🎓 Maestro", "en": "🎓 Teacher", "pt": "🎓 Professor", "fr": "🎓 Enseignant" },
};

const langs = ['es', 'en', 'pt', 'fr'];
langs.forEach(lang => {
  let file = './src/locales/' + lang + '.js';
  let content = fs.readFileSync(file, 'utf8');
  let newEntries = '';
  for (const key in dict) {
    if (!content.includes(`'${key}':`)) {
      newEntries += `  '${key}': "${dict[key][lang].replace(/"/g, '\\"')}",\n`;
    } else {
      // replace if exists
      const regex = new RegExp(`'${key}':\\s*".*?"`);
      content = content.replace(regex, `'${key}': "${dict[key][lang]}"`);
    }
  }
  if (newEntries) {
    content = content.replace(/\n\s+\/\/ Notifications/g, '\n' + newEntries + '\n  // Notifications');
  }
  fs.writeFileSync(file, content);
});
