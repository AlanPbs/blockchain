$files = git status -u --porcelain
foreach ($line in $files) {
    if ($line.Length -gt 3) {
        $file = $line.Substring(3).Trim()
        if ([string]::IsNullOrWhiteSpace($file)) { continue }
        Write-Host "Processing $file..."
        git add "$file"
        git commit -m "Add $file"
    }
}
