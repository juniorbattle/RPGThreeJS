# V10G-R2A.2: Clean root_vines and frost_bind spritesheets
# Removes magenta background and white edge halos
# Preserves dimensions (1280x1280), layout (5x5/25 frames), and intentional highlights

Add-Type -AssemblyName System.Drawing

function Clean-Spritesheet {
    param([string]$Path, [string]$Label)
    
    if (-not (Test-Path $Path)) {
        Write-Output "NOT FOUND: $Path"
        return
    }

    $img = [System.Drawing.Bitmap]::FromFile($Path)
    $w = $img.Width
    $h = $img.Height
    
    Write-Output "=== $Label ==="
    Write-Output "Dimensions: ${w}x${h}"

    # Count pixels before cleanup
    $magentaBefore = 0
    $whiteHaloBefore = 0
    for ($x = 0; $x -lt $w; $x++) {
        for ($y = 0; $y -lt $h; $y++) {
            $px = $img.GetPixel($x, $y)
            $r = $px.R; $g = $px.G; $b = $px.B; $a = $px.A
            
            # Magenta detection: high red + high blue + low green
            if ($r -gt 180 -and $b -gt 180 -and $g -lt 100 -and $a -gt 10) {
                $magentaBefore++
            }
            
            # White halo detection: high luminance, low saturation, semi-transparent or near transparent edges
            $lum = ($r * 0.299 + $g * 0.587 + $b * 0.114)
            $maxC = [Math]::Max($r, [Math]::Max($g, $b))
            $minC = [Math]::Min($r, [Math]::Min($g, $b))
            $sat = if ($maxC -gt 0) { ($maxC - $minC) / $maxC } else { 0 }
            if ($lum -gt 200 -and $sat -lt 0.15 -and $a -gt 10 -and $a -lt 200) {
                $whiteHaloBefore++
            }
        }
    }
    Write-Output "Magenta pixels before: $magentaBefore"
    Write-Output "White halo pixels before: $whiteHaloBefore"

    # Create a new 32bpp ARGB bitmap for processing
    $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $gfx = [System.Drawing.Graphics]::FromImage($bmp)
    $gfx.DrawImage($img, 0, 0, $w, $h)
    $gfx.Dispose()
    $img.Dispose()

    # Lock bits for fast processing
    $rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
    $bmpData = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $stride = $bmpData.Stride
    $scan0 = $bmpData.Scan0
    $bytes = New-Object byte[] ($stride * $h)
    [System.Runtime.InteropServices.Marshal]::Copy($scan0, $bytes, 0, $bytes.Length)

    $magentaRemoved = 0
    $haloReduced = 0

    for ($y = 0; $y -lt $h; $y++) {
        for ($x = 0; $x -lt $w; $x++) {
            $idx = $y * $stride + $x * 4
            $b = $bytes[$idx]
            $g = $bytes[$idx + 1]
            $r = $bytes[$idx + 2]
            $a = $bytes[$idx + 3]

            # Skip fully transparent pixels
            if ($a -eq 0) { continue }

            $maxC = [Math]::Max($r, [Math]::Max($g, $b))
            $minC = [Math]::Min($r, [Math]::Min($g, $b))
            $lum = ($r * 0.299 + $g * 0.587 + $b * 0.114)
            $sat = if ($maxC -gt 0) { ($maxC - $minC) / $maxC } else { 0 }

            # Magenta background removal: high red + high blue + low green + high saturation
            if ($r -gt 180 -and $b -gt 180 -and $g -lt 100 -and $sat -gt 0.3) {
                $bytes[$idx + 3] = 0  # Set alpha to 0
                $magentaRemoved++
                continue
            }

            # White halo reduction: high luminance + low saturation + semi-transparent
            # Only target edge pixels (low alpha or near-transparent areas)
            if ($lum -gt 200 -and $sat -lt 0.15 -and $a -gt 10 -and $a -lt 200) {
                # Reduce alpha to fade out the halo
                $newAlpha = [Math]::Max(0, [int]($a * 0.3))
                $bytes[$idx + 3] = $newAlpha
                $haloReduced++
                continue
            }

            # Near-magenta edge cleanup: pixels that are close to magenta but not exact
            if ($r -gt 150 -and $b -gt 150 -and $g -lt 80 -and $sat -gt 0.2 -and $a -gt 10) {
                $bytes[$idx + 3] = 0
                $magentaRemoved++
                continue
            }
        }
    }

    [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $scan0, $bytes.Length)
    $bmp.UnlockBits($bmpData)

    Write-Output "Magenta pixels removed: $magentaRemoved"
    Write-Output "White halo pixels reduced: $haloReduced"

    # Count pixels after cleanup
    $magentaAfter = 0
    $whiteHaloAfter = 0
    for ($x = 0; $x -lt $w; $x++) {
        for ($y = 0; $y -lt $h; $y++) {
            $px = $bmp.GetPixel($x, $y)
            $r = $px.R; $g = $px.G; $b = $px.B; $a = $px.A
            if ($r -gt 180 -and $b -gt 180 -and $g -lt 100 -and $a -gt 10) {
                $magentaAfter++
            }
            $lum = ($r * 0.299 + $g * 0.587 + $b * 0.114)
            $maxC = [Math]::Max($r, [Math]::Max($g, $b))
            $minC = [Math]::Min($r, [Math]::Min($g, $b))
            $sat = if ($maxC -gt 0) { ($maxC - $minC) / $maxC } else { 0 }
            if ($lum -gt 200 -and $sat -lt 0.15 -and $a -gt 10 -and $a -lt 200) {
                $whiteHaloAfter++
            }
        }
    }
    Write-Output "Magenta pixels after: $magentaAfter"
    Write-Output "White halo pixels after: $whiteHaloAfter"

    # Save cleaned PNG (preserve dimensions and format)
    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    
    Write-Output "Saved: $Path"
    Write-Output ""
}

$v2Dir = 'c:\Users\miche\Documents\Projects\RPGThreeJS\public\assets\vfx\runtime\v2'

Clean-Spritesheet -Path "$v2Dir\root_vines_5x5_25f_1280.png" -Label "root_vines"
Clean-Spritesheet -Path "$v2Dir\frost_bind_5x5_25f_1280.png" -Label "frost_bind"

Write-Output "=== Cleanup complete ==="
