#!/usr/bin/env bash
# PostToolUse (Write|Edit|MultiEdit): AVISA, no bloquea, cuando lo que se acaba de
# escribir en frontend/src/ trae un color a pelo en vez de un token:
#   - hexadecimal: #rgb, #rgba, #rrggbb, #rrggbbaa (también dentro de `bg-[#…]`)
#   - funciones de color: rgb(), rgba(), hsl(), hsla(), hwb(), lab(), lch(),
#     oklab(), oklch(), color()
#   - clases de la paleta de Tailwind: `bg-red-500`, `text-zinc-900/50`,
#     `border-white`, `from-black`… (los tokens son `bg-primary`,
#     `text-muted-foreground`, etc.)
# Queda fuera frontend/src/index.css: es la capa de tokens, donde el valor literal
# sí se escribe una vez para que el resto lo nombre.
#
# El aviso llega a Claude (`additionalContext`) y a la persona (`systemMessage`).
# Siempre sale con 0: un falso positivo no puede parar el trabajo.
#
# ESTO ES UNA RED, NO UN CANDADO. Lo que NO ve:
#   - Lo que no entra por Write/Edit/MultiEdit: un `sed`, un `npx shadcn add`, un
#     `cat > …` por Bash. Por eso los componentes que trae la CLI de shadcn pueden
#     colarlos sin aviso (`bg-white` en el tirador del `slider`, por ejemplo).
#   - Colores con nombre de CSS (`color: 'red'`, `fill="white"`), `transparent` y
#     `currentColor`: confundirían palabras corrientes con colores.
#   - Un color armado por partes (`'#' + hex`, `` `rgb(${r}, …)` ``).
# Y puede saltar de más: un ancla `href="#bad"` o un `#fff` dentro de un comentario
# también parecen colores.
set -uo pipefail

entrada=$(cat)

archivo=$(printf '%s' "$entrada" | jq -r '.tool_input.file_path // empty')
[ -n "$archivo" ] || exit 0

root="${CLAUDE_PROJECT_DIR:-}"
[ -n "$root" ] || root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0

case "$archivo" in
  "$root"/frontend/src/index.css) exit 0 ;;
  "$root"/frontend/src/*) ;;
  *) exit 0 ;;
esac

case "$archivo" in
  *.ts | *.tsx | *.js | *.jsx | *.css) ;;
  *) exit 0 ;;
esac

# Solo lo que se ha escrito ahora, no el archivo entero: el aviso es sobre esta
# edición, no sobre lo que ya estaba.
escrito=$(printf '%s' "$entrada" | jq -r '
  .tool_input
  | if .content then .content
    elif .new_string then .new_string
    elif .edits then [.edits[].new_string] | join("\n")
    else empty end')
[ -n "$escrito" ] || exit 0

paleta='slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
utilidad='bg|text|border|border-[trblxyse]|ring|ring-offset|outline|fill|stroke|from|via|to|decoration|shadow|accent|caret|divide|placeholder|inset-shadow|inset-ring'

hex='(^|[^[:alnum:]_&/.-])#([[:xdigit:]]{8}|[[:xdigit:]]{6}|[[:xdigit:]]{3,4})([^[:alnum:]_-]|$)'
funcion='(^|[^[:alnum:]_-])(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\('
clase="(^|[^[:alnum:]_-])(${utilidad})-((${paleta})-(50|[1-9]00|950)|white|black)(/[0-9]+)?([^[:alnum:]_-]|$)"

hallazgos=$(printf '%s\n' "$escrito" | grep -En -e "$hex" -e "$funcion" -e "$clase" | head -n 10)
[ -n "$hallazgos" ] || exit 0

relativo=${archivo#"$root"/}

# Cada línea con su número en el archivo, si se encuentra tal cual (Prettier puede
# estar reformateándolo a la vez; si no aparece, va sin número).
lista=""
while IFS= read -r linea; do
  texto=${linea#*:}
  recortado=$(printf '%s' "$texto" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//' | cut -c1-120)
  num=$(grep -nF -- "$recortado" "$archivo" 2>/dev/null | head -n1 | cut -d: -f1)
  lista+="  - ${relativo}${num:+:$num}: ${recortado}"$'\n'
done <<< "$hallazgos"

aviso="AVISO de colores-a-pelo.sh: lo que se acaba de escribir en ${relativo} trae un color literal en vez de un token.
${lista}Los colores se nombran por su token (\`bg-primary\`, \`text-muted-foreground\`, \`border-destructive\`, \`var(--…)\`), y el valor vive una sola vez en frontend/src/index.css. Si el color no tiene token, añádelo allí en vez de escribirlo aquí. Si el aviso es un falso positivo (un ancla \`#…\`, un comentario), ignóralo: este hook no bloquea."

jq -n --arg aviso "$aviso" --arg breve "Color a pelo en ${relativo}: usa un token de index.css." '{
  systemMessage: $breve,
  hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: $aviso }
}'

exit 0
