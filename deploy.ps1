# 1. Push to GitHub first
Write-Host "Pushing to GitHub..."
git add .
$commitMsg = Read-Host "Enter commit message"
git commit -m $commitMsg
git push origin main
Write-Host "GitHub updated"

# 2. Deploy to Vercel
Write-Host "Deploying to Vercel..."
$output = npx vercel --prod 2>&1
Write-Host $output
$newUrl = ($output | Select-String "suiyield-\w+-akintolasemilore.*?\.vercel\.app").Matches[0].Value
if ($newUrl) {
    npx vercel alias $newUrl suiyield-umzj.vercel.app
    Write-Host "Deployed to https://suiyield-umzj.vercel.app"
} else {
    Write-Host "Could not extract URL - run manually:"
    Write-Host "npx vercel alias YOUR_URL suiyield-umzj.vercel.app"
}