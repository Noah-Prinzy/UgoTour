param(
  [string]$OutputDirectory = ".\backups"
)

$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$file = Join-Path $OutputDirectory "ugotour-$timestamp.dump"

$pgDump = if ($env:PG_DUMP_PATH) { $env:PG_DUMP_PATH } else { "pg_dump" }
$args = @("--format=custom", "--no-owner", "--no-privileges", "--file=$file")

if ($env:DATABASE_URL) {
  & $pgDump @args $env:DATABASE_URL
} else {
  $env:PGPASSWORD = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "UgoTour_dev_2026!" }
  $hostName = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
  $port = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
  $user = if ($env:DB_USER) { $env:DB_USER } else { "ugotour_user" }
  $db = if ($env:DB_NAME) { $env:DB_NAME } else { "ugotour_db" }
  & $pgDump @args -h $hostName -p $port -U $user $db
}

if ($LASTEXITCODE -ne 0) { throw "pg_dump failed with exit code $LASTEXITCODE" }
Write-Host "Backup created: $file"
