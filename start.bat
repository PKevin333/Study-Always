@echo off
title Orientador de Estudos - Iniciando Servidor Local
echo ===================================================
echo   ORIENTADOR DE ESTUDOS - BOOTSTRAP DE INICIALIZACAO
echo ===================================================
echo.

:: 1. Verificar se o Node.js está instalado
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] O Node.js nao esta instalado ou nao foi encontrado no PATH.
    echo Por favor, instale o Node.js (https://nodejs.org) e tente novamente.
    echo.
    pause
    exit /b 1
)

:: 2. Entrar na pasta do projeto atual
cd /d "%~dp0"

:: 3. Verificar node_modules e rodar npm install se não existir
if not exist "node_modules\" (
    echo [INFO] Pasta node_modules nao encontrada. Instalando dependencias...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao instalar dependencias do npm. Verifique sua conexao.
        pause
        exit /b 1
    )
)

:: 4. Abrir o navegador automaticamente em http://localhost:3000 apenas quando o servidor estiver respondendo
echo [INFO] Aguardando o servidor local inicializar para abrir o navegador...
start /b "" cmd /c "@echo off & :poll & curl -sI http://localhost:3000 >nul 2>&1 & if errorlevel 1 (timeout /t 1 >nul & goto poll) & start http://localhost:3000"

:: 5. Iniciar o servidor dev
echo.
echo ===================================================
echo  ✅ Servidor inicializando! O navegador abrira...
echo  Mantenha esta janela aberta para ver os logs locais.
echo ===================================================
echo.
npm run dev
pause
