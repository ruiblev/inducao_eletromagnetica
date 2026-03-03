#!/usr/bin/env bash
# run.sh – Abre o Simulador de Indução Eletromagnética no browser padrão

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FILE="$DIR/index.html"

if [ ! -f "$FILE" ]; then
  echo "❌ Ficheiro não encontrado: $FILE"
  exit 1
fi

echo "🔬 A abrir o Simulador de Indução Eletromagnética..."
open "$FILE"
