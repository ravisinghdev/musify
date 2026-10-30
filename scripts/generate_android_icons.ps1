Add-Type -AssemblyName System.Drawing

$srcPath = "P:\next-js\musify\apps\web\public\icon-512.png"
$src = [System.Drawing.Image]::FromFile($srcPath)
$resDir = "P:\next-js\musify\apps\web\android\app\src\main\res"

function Resize-Image($image, $targetWidth, $targetHeight, $destPath) {
    $bitmap = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.DrawImage($image, 0, 0, $targetWidth, $targetHeight)
    $bitmap.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
}

function Create-Foreground($image, $canvasSize, $destPath) {
    $bitmap = New-Object System.Drawing.Bitmap($canvasSize, $canvasSize)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.Clear([System.Drawing.Color]::Transparent)
    
    # Adaptive icon safe zone is center 66%
    $iconSize = [int]($canvasSize * 0.72)
    $offset = [int](($canvasSize - $iconSize) / 2)
    $graphics.DrawImage($image, $offset, $offset, $iconSize, $iconSize)
    
    $bitmap.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
}

$densities = @{
    "mipmap-mdpi" = @{ launcher = 48; fg = 108 }
    "mipmap-hdpi" = @{ launcher = 72; fg = 162 }
    "mipmap-xhdpi" = @{ launcher = 96; fg = 216 }
    "mipmap-xxhdpi" = @{ launcher = 144; fg = 324 }
    "mipmap-xxxhdpi" = @{ launcher = 192; fg = 432 }
}

foreach ($d in $densities.Keys) {
    $targetDir = Join-Path $resDir $d
    if (-not (Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
    
    $size = $densities[$d].launcher
    $fgSize = $densities[$d].fg
    
    Resize-Image $src $size $size (Join-Path $targetDir "ic_launcher.png")
    Resize-Image $src $size $size (Join-Path $targetDir "ic_launcher_round.png")
    Create-Foreground $src $fgSize (Join-Path $targetDir "ic_launcher_foreground.png")
    Write-Host "Generated $d (Launcher: ${size}x${size}, Foreground: ${fgSize}x${fgSize})"
}

# Generate Splash screens
$drawableSplash = Join-Path $resDir "drawable\splash.png"
Resize-Image $src 480 480 $drawableSplash
Write-Host "Generated drawable/splash.png"

$src.Dispose()
Write-Host "All Android icons and splash assets successfully generated!"

