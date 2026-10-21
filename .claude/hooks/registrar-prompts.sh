#!/usr/bin/env bash
# SessionStart, UserPromptSubmit, Stop y SessionEnd: registra en `prompts.md`
# (raíz del proyecto) cada prompt y cada respuesta, en Markdown y sin borrar
# nunca lo que ya hay (solo añade al final; si el fichero no existe, lo crea).
#
# El formato es el de la plantilla de entrega del curso (`git show
# 898650a:prompts.md`), que es lo que lee la herramienta que revisa:
#   Prompt:     ## Prompt N              (N sigue al mayor que ya haya en el fichero)
#               **Modelo:**, **Herramienta:** (más fecha y hora, esfuerzo y sesión)
#               el texto, literal, dentro de un bloque de código sin lenguaje
#   Respuesta:  ### Respuesta a Prompt N (subapartado del prompt, después de su bloque)
#               todo el texto de la respuesta
#
# De dónde sale cada dato:
#   - Modelo: el del último mensaje del asistente en el transcript; si aún no
#     hay ninguno, el que dio SessionStart; si no, `model` de los settings.
#   - Esfuerzo: `effort.level` de la entrada, CLAUDE_EFFORT o
#     `modelSettings.<modelo>.effortLevel` de los settings.
#   - Respuesta: los bloques de texto del transcript desde el prompt,
#     más `last_assistant_message` de Stop (el transcript puede no tener aún
#     escrito el último mensaje cuando salta el hook).
#
# Si un Stop no llega a ejecutarse (hook añadido a mitad de turno, sesión
# cortada), el siguiente UserPromptSubmit o el SessionEnd registra la respuesta
# pendiente antes de seguir. El estado por sesión vive en `.estado-prompts/`
# (ignorado por git).
#
# Nunca bloquea ni escribe en stdout: en UserPromptSubmit, lo que sale por
# stdout entra como contexto del modelo.
set -uo pipefail
exec 1>/dev/null

entrada=$(cat)
campo() { jq -r "$1 // empty" <<<"$entrada"; }

raiz=${CLAUDE_PROJECT_DIR:-$(campo '.cwd')}
destino="$raiz/prompts.md"
estado_dir="$raiz/.claude/hooks/.estado-prompts"
evento=$(campo '.hook_event_name')
sesion=$(campo '.session_id')
transcript=$(campo '.transcript_path')
[ -n "$sesion" ] && [ -n "$raiz" ] || exit 0

mkdir -p "$estado_dir" || exit 0
estado="$estado_dir/$sesion.json"
[ -s "$estado" ] || echo '{}' >"$estado"

# Un solo escritor a la vez (dos sesiones en paralelo comparten prompts.md).
exec 9>"$estado_dir/.lock"
flock -w 10 9 || exit 0

leer() { jq -r "$1 // empty" "$estado"; }
guardar() {
  local tmp
  tmp=$(mktemp "$estado_dir/.tmp.XXXXXX") || return 0
  jq "$@" "$estado" >"$tmp" && mv "$tmp" "$estado" || rm -f "$tmp"
}
lineas_transcript() { if [ -f "$transcript" ]; then wc -l <"$transcript"; else echo 0; fi; }
ahora() { date '+%Y-%m-%d %H:%M:%S %Z'; }

asegurar_destino() {
  [ -f "$destino" ] && return 0
  cat >"$destino" <<'EOF'
# Prompts
EOF
}

# Fence de bloque de código más largo que cualquier racha de ` del texto.
fence_para() {
  local n
  n=$(grep -oE '`+' <<<"$1" | awk '{ print length }' | sort -n | tail -1)
  n=${n:-0}
  [ "$n" -ge 3 ] || n=2
  printf '%*s' "$((n + 1))" '' | tr ' ' '`'
}

# Arma el cuerpo de la respuesta a partir de las entradas del transcript.
read -r -d '' PROGRAMA_RESPUESTA <<'JQ'
[ .[] | select(.type == "assistant" and (.isSidechain | not)) | .message.content[]? ] as $bloques
| [ $bloques[] | select(.type == "text") | .text | select(test("\\S")) ] as $textos
| (if ($final | test("\\S")) and (($textos | last // "") | rtrimstr("\n")) != ($final | rtrimstr("\n"))
   then $textos + [$final] else $textos end) as $textos
| if ($textos | length) > 0 then $textos | join("\n\n")
  else "_(Sin texto de respuesta: el turno solo tuvo acciones.)_" end
JQ

# $1: last_assistant_message (vacío si no lo hay).
# $2: última línea del transcript que pertenece a la respuesta; al registrarla
#     con retraso, la anterior al prompt siguiente. Sin él, hasta el final.
registrar_respuesta() {
  local final=$1 num desde hasta titulo entradas cuerpo fin fecha
  num=$(leer '.prompt')
  [ -n "$num" ] || return 0
  desde=$(leer '.desde')
  desde=${desde:-0}
  hasta=${2:-$(lineas_transcript)}
  if [ "$(leer '.respondido')" = "true" ]; then
    # Otro Stop sin prompt nuevo (p. ej. un agente en segundo plano que despierta al modelo).
    titulo="### Respuesta a Prompt $num (continuación)"
  else
    titulo="### Respuesta a Prompt $num"
  fi
  entradas=$(
    [ -f "$transcript" ] && head -n "$hasta" "$transcript" | tail -n +"$((desde + 1))" |
      jq -R -c 'fromjson? // empty'
  )
  cuerpo=$(jq -rs --arg final "$final" "$PROGRAMA_RESPUESTA" <<<"$entradas") || return 0
  # Hora del último mensaje de la respuesta; si no la hay (Stop con el
  # transcript aún sin volcar), la de ahora, que es cuando acaba el turno.
  fin=$(jq -r 'select(.type == "assistant" and (.isSidechain | not)) | .timestamp // empty' <<<"$entradas" | tail -1)
  if [ -n "$fin" ] && [ -z "$final" ]; then fecha=$(date -d "$fin" '+%Y-%m-%d %H:%M:%S %Z' 2>/dev/null); fi
  fecha=${fecha:-$(ahora)}
  asegurar_destino
  printf '\n%s\n\n*Finalizada: %s*\n\n%s\n' "$titulo" "$fecha" "$cuerpo" >>"$destino"
  guardar --argjson hasta "$hasta" '.respondido = true | .desde = $hasta'
}

buscar_en_settings() {
  local filtro=$1 f v
  for f in "$raiz/.claude/settings.local.json" "$raiz/.claude/settings.json" "$HOME/.claude/settings.json"; do
    [ -f "$f" ] || continue
    v=$(jq -r "$filtro // empty" "$f" 2>/dev/null)
    [ -n "$v" ] && { echo "$v"; return 0; }
  done
}

registrar_prompt() {
  local prompt prompt_id linea="" ts="" desde modelo esfuerzo version herramienta fecha max num fence
  prompt=$(campo '.prompt')
  prompt_id=$(campo '.prompt_id')

  # Si el prompt ya está en el transcript, de ahí salen su línea y su hora exacta.
  if [ -n "$prompt_id" ] && [ -f "$transcript" ]; then
    IFS=$'\t' read -r linea ts < <(
      jq -R -r --arg id "$prompt_id" \
        'fromjson? // empty | select(.type == "user" and .promptId == $id and (.isMeta | not) and .toolUseResult == null)
         | [input_line_number, .timestamp] | @tsv' "$transcript" | head -1
    )
  fi
  desde=${linea:-$(lineas_transcript)}

  # Respuesta anterior que ningún Stop llegó a registrar: acaba justo antes de este prompt.
  if [ -n "$(leer '.prompt')" ] && [ "$(leer '.respondido')" != "true" ]; then
    registrar_respuesta "" "$((linea ? linea - 1 : desde))"
  fi

  if [ -f "$transcript" ]; then
    modelo=$(head -n "$desde" "$transcript" | jq -R -r 'fromjson? // empty
      | select(.type == "assistant" and (.isSidechain | not)) | .message.model // empty
      | select(startswith("<") | not)' | tail -1)
    version=$(head -n "$((desde + 1))" "$transcript" | jq -R -r 'fromjson? // empty | .version // empty' | tail -1)
  fi
  modelo=${modelo:-$(leer '.modelo')}
  modelo=${modelo:-$(buscar_en_settings '.model')}
  modelo=${modelo:-predeterminado}

  esfuerzo=$(campo '.effort.level')
  esfuerzo=${esfuerzo:-${CLAUDE_EFFORT:-}}
  esfuerzo=${esfuerzo:-$(buscar_en_settings "(.modelSettings[\"$modelo\"].effortLevel // .effortLevel)")}
  esfuerzo=${esfuerzo:-predeterminado}

  herramienta="Claude Code${version:+ $version} (${CLAUDE_CODE_ENTRYPOINT:-cli})"
  if [ -n "$ts" ]; then fecha=$(date -d "$ts" '+%Y-%m-%d %H:%M:%S %Z' 2>/dev/null); fi
  fecha=${fecha:-$(ahora)}

  asegurar_destino
  max=$(grep -oE '^## Prompt #? ?[0-9]+$' "$destino" | grep -oE '[0-9]+$' | sort -n | tail -1)
  num=$((${max:-0} + 1))
  fence=$(fence_para "$prompt")

  {
    printf '\n---\n\n## Prompt %s\n\n' "$num"
    printf '**Modelo:** %s\n**Herramienta:** %s\n**Esfuerzo:** %s\n**Fecha y hora:** %s\n**ID de sesión:** `%s`\n\n' \
      "$modelo" "$herramienta" "$esfuerzo" "$fecha" "$sesion"
    printf '%s\n%s\n%s\n' "$fence" "$prompt" "$fence"
  } >>"$destino"

  guardar --argjson num "$num" --argjson desde "$desde" \
    '.prompt = $num | .desde = $desde | .respondido = false'
}

case "$evento" in
  SessionStart)
    modelo=$(campo '.model')
    [ -n "$modelo" ] && guardar --arg m "$modelo" '.modelo = $m'
    ;;
  UserPromptSubmit) registrar_prompt ;;
  Stop) registrar_respuesta "$(campo '.last_assistant_message')" ;;
  SessionEnd)
    [ -n "$(leer '.prompt')" ] && [ "$(leer '.respondido')" != "true" ] && registrar_respuesta ""
    ;;
esac
exit 0
