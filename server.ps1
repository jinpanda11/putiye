$port = 3000
$root = Split-Path $MyInvocation.MyCommand.Path

# Try to use Node.js http-server if available
try {
    $node = Get-Command node -ErrorAction Stop
    # Check if http-server is installed
    $hs = & $node -e "try{require.resolve('http-server')}catch(e){}"
    if ($hs) {
        & $node -e "const hs = require('http-server'); hs.createServer({root: '$root', cache: -1}).listen($port, () => console.log('Server running at http://localhost:' + $port))"
        return
    }
} catch {}

# Fallback: use .NET HttpListener
Add-Type -AssemblyName System.Net.Http
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$port/" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    $localPath = $request.Url.AbsolutePath.TrimStart('/')
    if ([string]::IsNullOrEmpty($localPath)) { $localPath = "index.html" }
    
    $filePath = Join-Path $root $localPath
    if (-not (Test-Path $filePath)) {
        # Try index.html in directory
        $dirPath = Join-Path $root ($localPath + "/index.html")
        if (Test-Path $dirPath) { $filePath = $dirPath }
    }
    
    if (Test-Path $filePath) {
        $contentType = switch ([System.IO.Path]::GetExtension($filePath)) {
            '.html' { 'text/html; charset=utf-8' }
            '.css'  { 'text/css; charset=utf-8' }
            '.js'   { 'application/javascript; charset=utf-8' }
            '.json' { 'application/json; charset=utf-8' }
            '.svg'  { 'image/svg+xml' }
            '.ico'  { 'image/x-icon' }
            '.png'  { 'image/png' }
            '.jpg'  { 'image/jpeg' }
            '.woff2'{ 'font/woff2' }
            default { 'application/octet-stream' }
        }
        $response.ContentType = $contentType
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $response.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes("404 - File not found")
        $response.OutputStream.Write($msg, 0, $msg.Length)
    }
    $response.Close()
}
