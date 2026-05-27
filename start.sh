#!/bin/bash

echo "==================================================="
echo "  ORIENTADOR DE ESTUDOS - BOOTSTRAP DE INICIALIZACAO"
echo "==================================================="
echo ""

# 1. Verificar se o Node.js está instalado
if ! command -v node &> /dev/null
then
    echo "[ERRO] O Node.js não está instalado. Por favor, instale-o antes de prosseguir."
    exit 1
fi

# 2. Entrar na pasta do projeto atual
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 3. Verificar node_modules e rodar npm install se não existir
if [ ! -d "node_modules" ]; then
    echo "[INFO] Pasta node_modules não encontrada. Instalando dependências..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERRO] Falha ao instalar dependências do npm."
        exit 1
    fi
fi

# 4. Abrir o navegador automaticamente em http://localhost:3000 apenas quando o servidor estiver respondendo
(
    echo "Aguardando o servidor local estar pronto..."
    until curl -sI http://localhost:3000 >/dev/null 2>&1; do
        sleep 1
    done
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000
    elif command -v open &> /dev/null; then
        open http://localhost:3000
    else
        echo "[INFO] Abra seu navegador em http://localhost:3000"
    fi
) &

# 5. Iniciar o servidor dev
echo ""
echo "==================================================="
echo "  ✅ Servidor inicializando! O navegador abrirá..."
echo "  Mantenha este terminal aberto para acompanhar os logs."
echo "==================================================="
echo ""
npm run dev
