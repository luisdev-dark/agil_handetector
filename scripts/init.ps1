param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host "=== Inicializando proyecto Flask ASL ===" -ForegroundColor Cyan

# Crear y activar entorno virtual
$venvPath = Join-Path (Get-Location) ".venv"
if (!(Test-Path $venvPath) -or $Force) {
    Write-Host "Creando entorno virtual en $venvPath" -ForegroundColor Yellow
    python -m venv ".venv"
}

Write-Host "Activando entorno virtual" -ForegroundColor Yellow
$activateScript = Join-Path $venvPath "Scripts/Activate.ps1"
. $activateScript

# Actualizar pip e instalar dependencias
Write-Host "Actualizando pip" -ForegroundColor Yellow
python -m pip install --upgrade pip

Write-Host "Instalando dependencias desde requirements.txt" -ForegroundColor Yellow
pip install -r requirements.txt

# Configurar archivo .env
if (!(Test-Path ".env") -or $Force) {
    Write-Host "Creando archivo .env" -ForegroundColor Yellow
    Copy-Item ".env.example" ".env" -Force
    $secret = [System.Guid]::NewGuid().ToString("N")
    (Get-Content ".env") -replace "SECRET_KEY=change_me_generate_on_init", "SECRET_KEY=$secret" | Set-Content ".env"
}

# Verificar modelos
$modelPath = "models/asl_quick_model.h5"
$mappingPath = "models/class_mapping_quick.json"
if (!(Test-Path $modelPath) -or !(Test-Path $mappingPath)) {
    Write-Host "⚠️ Modelos no encontrados. Asegúrate de entrenar o colocar los archivos en 'models/'" -ForegroundColor Red
    Write-Host "   Sugerencia: ejecuta 'python quick_train.py' si está disponible" -ForegroundColor DarkYellow
} else {
    Write-Host "✅ Modelos detectados" -ForegroundColor Green
}

Write-Host "=== Inicialización completada ===" -ForegroundColor Cyan
Write-Host "Para ejecutar la aplicación:" -ForegroundColor Cyan
Write-Host "1) . .venv\\Scripts\\Activate.ps1" -ForegroundColor White
Write-Host "2) python app.py" -ForegroundColor White