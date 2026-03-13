$envFile = ".env.local"
$envs = @(
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
)

$oldEnvs = @(
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "FIREBASE_ADMIN_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY"
)

Write-Host "Removing old Firebase environment variables from Vercel..."
foreach ($key in $oldEnvs) {
    npx vercel env rm $key production,preview,development -y | Out-Null
    Write-Host "Removed $key"
}

Write-Host "Adding new Supabase environment variables to Vercel..."
foreach ($line in Get-Content $envFile) {
    if ($line -match "^([^=]+)=(.*)$") {
        $key = $matches[1]
        $value = $matches[2]
        
        if ($envs -contains $key) {
            # Trim quotes if present
            if ($value.StartsWith('"') -and $value.EndsWith('"')) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            npx vercel env rm $key production,preview,development -y | Out-Null
            $value | npx vercel env add $key production,preview,development | Out-Null
            Write-Host "Added $key"
        }
    }
}
Write-Host "Vercel environment variables updated successfully!"
