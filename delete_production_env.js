const { execSync } = require('child_process');

const keysToDelete = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "PORTAL_API_KEY",
  "NEXT_PUBLIC_APP_URL",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM"
];

(async () => {
  console.log("Starting deletion of all environment variables from Production...");
  for (const key of keysToDelete) {
    try {
      console.log(`Removing ${key} from production...`);
      execSync(`npx vercel env rm ${key} production -y`, { stdio: 'ignore' });
      console.log(` - ${key} ✅ Removed`);
    } catch (e) {
      console.error(` - ${key} ❌ Failed to remove or already deleted`);
    }
  }
  console.log("Finished deleting all environment variables from Production!");
})();
