# VEXORA — Espace membres & gestion des KEYS

Site statique (hébergeable sur **GitHub Pages**) + base de données partagée **Supabase** (gratuite).
Les KEYS créées dans l'admin sont stockées en ligne : tous les visiteurs les voient immédiatement.

## Mise en ligne en 6 étapes

1. **Supabase** : créez un compte sur supabase.com → *New project*.
2. **Base de données** : *SQL Editor* → *New query* → collez tout `supabase.sql` → *Run*.
3. **Auth** : *Authentication → Providers → Email* → désactivez *Confirm email* (sinon chaque inscrit doit valider son email). Dans *Authentication → URL Configuration*, mettez l'URL de votre site GitHub Pages en *Site URL*.
4. **Config** : *Project Settings → API* → copiez **Project URL** et la clé **anon public** dans `config.js`.
   ⚠️ Jamais la clé `service_role`.
5. **GitHub** : créez un dépôt, envoyez tous les fichiers, puis *Settings → Pages → Deploy from branch → main / root*.
6. **Admin** : sur le site, créez VOTRE compte (votre email + mot de passe), puis dans le *SQL Editor* exécutez :
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'VOTRE_EMAIL@exemple.com';
   ```
   Vous accédez ensuite à `/admin/` avec ce même compte.

## Sécurité
- Aucun mot de passe n'est stocké dans le code : l'authentification est gérée par Supabase.
- La clé `anon` est publique par conception ; la protection repose sur les règles RLS de `supabase.sql` (les utilisateurs ne peuvent ni lister ni modifier les KEYS, seulement en activer une).
- Les liens de téléchargement ne sont révélés qu'après activation d'une KEY. Hébergez vos fichiers sur un lien non public/difficile à deviner.

## Structure
```
index.html        espace membres (connexion, activation, téléchargements)
admin/index.html  administration (créer / modifier / supprimer des KEYS)
config.js         URL + clé publique Supabase
assets/           style.css, common.js, user.js, admin.js
supabase.sql      tables, règles de sécurité et fonctions
```
