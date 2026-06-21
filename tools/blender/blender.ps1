param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]] $BlenderArgs
)

$ErrorActionPreference = 'Stop'

function Resolve-BlenderExecutable {
  if ($env:BLENDER_PATH) {
    if (Test-Path -LiteralPath $env:BLENDER_PATH -PathType Leaf) {
      return (Resolve-Path -LiteralPath $env:BLENDER_PATH).Path
    }

    throw "BLENDER_PATH does not point to a file: $env:BLENDER_PATH"
  }

  $command = Get-Command blender -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  $knownInstallations = @(
    'C:\Program Files\Blender Foundation\Blender 5.0\blender.exe',
    'C:\Program Files\Blender Foundation\Blender 4.4\blender.exe',
    'C:\Program Files\Blender Foundation\Blender 4.3\blender.exe',
    'C:\Program Files\Blender Foundation\Blender 4.2\blender.exe'
  )

  foreach ($candidate in $knownInstallations) {
    if (Test-Path -LiteralPath $candidate -PathType Leaf) {
      return $candidate
    }
  }

  $shortcutDirectory = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Blender'
  if (Test-Path -LiteralPath $shortcutDirectory -PathType Container) {
    $shortcutFile = Get-ChildItem -LiteralPath $shortcutDirectory -Filter 'Blender*.lnk' |
      Sort-Object Name -Descending |
      Select-Object -First 1

    if ($shortcutFile) {
      $shell = New-Object -ComObject WScript.Shell
      $shortcut = $shell.CreateShortcut($shortcutFile.FullName)
      $targetDirectory = Split-Path -Parent $shortcut.TargetPath
      $candidate = Join-Path $targetDirectory 'blender.exe'

      if (Test-Path -LiteralPath $candidate -PathType Leaf) {
        return $candidate
      }
    }
  }

  throw 'Blender was not found. Set BLENDER_PATH to the full path of blender.exe.'
}

$blenderExecutable = Resolve-BlenderExecutable
Write-Host "Using Blender: $blenderExecutable"

& $blenderExecutable @BlenderArgs
exit $LASTEXITCODE
