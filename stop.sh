#!/bin/bash

echo "==================================================="
echo "    ENCERRANDO SERVIDOR DA PORTA 3000"
echo "==================================================="
echo ""

# Encontrar o PID na porta 3000 e encerrá-lo
PID=$(lsof -t -i:3000)

if [ -n "$PID" ]; then
    echo "[INFO] Encontrado processo PID $PID na porta 3000. Finalizando..."
    kill -9 $PID
else
    echo "[INFO] Nenhum processo rodando na porta 3000."
fi

echo ""
echo "==================================================="
echo "  ✅ Servidor encerrado."
echo "==================================================="
echo ""
