Add-Type -AssemblyName System.Drawing
$src = "e:\MindSync\public\mindSync-logo.png"
$img = [System.Drawing.Image]::FromFile($src)

function Resize-AppIcon([int]$width, [int]$height, [string]$dest) {
    $target = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($target)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($img, 0, 0, $width, $height)
    $target.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $target.Dispose()
    Write-Host "Generated: $dest"
}

Resize-AppIcon 192 192 "e:\MindSync\public\icons\icon-192x192.png"
Resize-AppIcon 512 512 "e:\MindSync\public\icons\icon-512x512.png"
Resize-AppIcon 180 180 "e:\MindSync\public\icons\apple-icon-180.png"

$img.Dispose()
