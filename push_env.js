const { spawn } = require('child_process');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const keysToPush = [
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

const targetEnvs = ['production', 'development'];

const runVercelEnvAdd = (key, env, value) => {
  return new Promise((resolve, reject) => {
    let cleanValue = value;
    if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
      cleanValue = cleanValue.slice(1, -1);
    }
    
    try { 
      require('child_process').execSync(`npx vercel env rm ${key} ${env} -y`, { stdio: 'ignore' }); 
    } catch(e){}

    try {
      require('child_process').execSync(`npx vercel env add ${key} ${env} --value "${cleanValue.replace(/"/g, '\\"')}" --yes`, { stdio: 'ignore' });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

(async () => {
  for (const key of keysToPush) {
    if (process.env[key] !== undefined) {
      console.log(`Setting ${key}...`);
      for (const env of targetEnvs) {
        try {
          await runVercelEnvAdd(key, env, process.env[key]);
          console.log(` - ${env} ✅`);
        } catch (e) {
          console.error(` - ${env} ❌ (${e.message})`);
        }
      }
    }
  }
  console.log('Finished syncing environment variables!');
})();
