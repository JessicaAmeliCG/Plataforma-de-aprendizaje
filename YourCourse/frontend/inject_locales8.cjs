const fs = require('fs');

const dict = {
  "settings.styleProfessional": { "es": "Profesional (Sobrio)", "en": "Professional (Sober)", "pt": "Profissional (Sóbrio)", "fr": "Professionnel (Sobre)" },
  "settings.styleVibrant":      { "es": "Vibrante (Moderno)", "en": "Vibrant (Modern)", "pt": "Vibrante (Moderno)", "fr": "Vibrant (Moderne)" },
  "settings.styleForest":       { "es": "Bosque (Esmeralda)", "en": "Forest (Emerald)", "pt": "Floresta (Esmeralda)", "fr": "Forêt (Émeraude)" },
  "settings.styleOcean":        { "es": "Océano (Profundo)", "en": "Ocean (Deep)", "pt": "Oceano (Profundo)", "fr": "Océan (Profond)" },
  "settings.styleSunset":       { "es": "Ocaso (Ámbar)", "en": "Sunset (Amber)", "pt": "Pôr do sol (Âmbar)", "fr": "Crépuscule (Ambre)" },
  
  "settings.avatarThemeMain":   { "es": "Tema Principal", "en": "Main Theme", "pt": "Tema Principal", "fr": "Thème Principal" },
  "settings.avatarBlue":        { "es": "Azul", "en": "Blue", "pt": "Azul", "fr": "Bleu" },
  "settings.avatarGreen":       { "es": "Verde", "en": "Green", "pt": "Verde", "fr": "Vert" },
  "settings.avatarPink":        { "es": "Rosa", "en": "Pink", "pt": "Rosa", "fr": "Rose" },
  "settings.avatarOrange":      { "es": "Naranja", "en": "Orange", "pt": "Laranja", "fr": "Orange" },
  "settings.avatarRed":         { "es": "Rojo", "en": "Red", "pt": "Vermelho", "fr": "Rouge" },
  "settings.avatarIndigo":      { "es": "Índigo", "en": "Indigo", "pt": "Índigo", "fr": "Indigo" },
  "settings.avatarTeal":        { "es": "Cerceta", "en": "Teal", "pt": "Verde-azulado", "fr": "Sarcelle" },
  "settings.avatarFuchsia":     { "es": "Fucsia", "en": "Fuchsia", "pt": "Fúcsia", "fr": "Fuchsia" },
  "settings.avatarLime":        { "es": "Lima", "en": "Lime", "pt": "Limão", "fr": "Citron vert" },
  "settings.avatarSky":         { "es": "Cielo", "en": "Sky", "pt": "Céu", "fr": "Ciel" },
  "settings.avatarFire":        { "es": "Fuego", "en": "Fire", "pt": "Fogo", "fr": "Feu" },
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
