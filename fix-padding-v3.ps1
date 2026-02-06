$files = Get-ChildItem -Path "c:\loggerisemobil\app" -Recurse -Filter "*.tsx"

foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        $originalContent = $content
        
        # Regex pattern for DashboardSpacing value (dot notation or bracket notation)
        $dsPattern = "DashboardSpacing(\.\w+|\[['`"]\w+['`"]\])"

        # 1. content style - paddingTop
        $content = [regex]::Replace($content, "(content:\s*\{[^}]*?)paddingTop:\s*$dsPattern,?", '$1paddingTop: 0,')
        
        # 2. scrollContent style - paddingTop
        $content = [regex]::Replace($content, "(scrollContent:\s*\{[^}]*?)paddingTop:\s*$dsPattern,?", '$1paddingTop: 0,')
        
        # 3. listContent style - paddingTop
        $content = [regex]::Replace($content, "(listContent:\s*\{[^}]*?)paddingTop:\s*$dsPattern,?", '$1paddingTop: 0,')

        # 4. searchContainer style - marginTop
        $content = [regex]::Replace($content, "(searchContainer:\s*\{[^}]*?)marginTop:\s*$dsPattern,?", '$1marginTop: 0,')

        # 5. searchContainer style - paddingTop
        $content = [regex]::Replace($content, "(searchContainer:\s*\{[^}]*?)paddingTop:\s*$dsPattern,?", '$1paddingTop: 0,')

        # 6. contentContainer style - paddingTop (New for detail pages)
        $content = [regex]::Replace($content, "(contentContainer:\s*\{[^}]*?)paddingTop:\s*$dsPattern,?", '$1paddingTop: 0,')

        if ($content -ne $originalContent) {
            [System.IO.File]::WriteAllText($file.FullName, $content)
            Write-Host "Fixed: $($file.Name)"
        }
    }
    catch {
        Write-Host "Error processing $($file.Name): $_"
    }
}
