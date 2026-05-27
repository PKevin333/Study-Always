@echo off
title Orientador de Estudos - Encerrando Servidor Local
echo ===================================================
echo     ENCERRANDO SERVIDOR DA PORTA 3000
echo ===================================================
echo.

:: Procurar o PID ocupando a porta 3000 e encerrá-lo
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    if not "%%a"=="" (
        echo [INFO] Encontrado processo com PID %%a na porta 3000. Finalizando...
        taskkill /f /pid %%a >nul 2>&1
    )
)

echo.
echo ===================================================
echo  ✅ Servidor encerrado.
echo ===================================================
echo.
timeout /t 3 >nul
