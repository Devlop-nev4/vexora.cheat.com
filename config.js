// Configuration publique du site.
// Ces deux valeurs se trouvent dans Supabase : Project Settings → API.
// La clé "anon" est publique par conception (la sécurité repose sur les règles RLS du fichier supabase.sql).
// ⚠️ Ne mettez JAMAIS la clé "service_role" ici.
window.VEXORA_CONFIG = {
  SUPABASE_URL: "https://VOTRE-PROJET.supabase.co",
  SUPABASE_ANON_KEY: "VOTRE_CLE_ANON_PUBLIQUE",
  DISCORD_URL: "https://discord.gg/9GddS6t7X8"
};
