# ============================================================
# UGOTOUR POSTGRESQL BACKUP SCRIPT
# Creates a timestamped custom-format pg_dump. It supports either DATABASE_URL
# (common on hosting platforms) or the individual local DB_* environment values.
# ============================================================

# Allow the caller to choose where backup files are written.
param(
  [string]$OutputDirectory = ".\backups"
)

# Stop immediately when PowerShell encounters an error.
$ErrorActionPreference = "Stop"

# Create the backup directory and a unique timestamped output filename.
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$file = Join-Path $OutputDirectory "ugotour-$timestamp.dump"

# Use an explicitly configured pg_dump path when provided; otherwise rely on PATH.
$pgDump = if ($env:PG_DUMP_PATH) { $env:PG_DUMP_PATH } else { "pg_dump" }
$args = @("--format=custom", "--no-owner", "--no-privileges", "--file=$file")

# Hosted environments usually provide one complete PostgreSQL connection URL.
if ($env:DATABASE_URL) {
  & $pgDump @args $env:DATABASE_URL
} else {
  # Local development builds the connection from individual variables/defaults.
  $env:PGPASSWORD = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "UgoTour_dev_2026!" }
  $hostName = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
  $port = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }
  $user = if ($env:DB_USER) { $env:DB_USER } else { "ugotour_user" }
  $db = if ($env:DB_NAME) { $env:DB_NAME } else { "ugotour_db" }
  & $pgDump @args -h $hostName -p $port -U $user $db
}

# Treat a non-zero pg_dump exit code as a failed backup instead of printing success.
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed with exit code $LASTEXITCODE" }
Write-Host "Backup created: $file"
