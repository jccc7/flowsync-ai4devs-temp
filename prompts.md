# Prompts

Aquí van **todos los prompts que lanzaste** para hacer el ejercicio, en el orden en que los
lanzaste, con el modelo y la herramienta de cada uno.

Esto no es papeleo. Lo que se revisa es **cómo pediste las cosas**, no solo lo que salió: un
resultado flojo con un prompt bueno y un resultado flojo con un prompt vago necesitan feedback
distinto, y sin este archivo no se distinguen.

## Cómo rellenarlo

- Un apartado `## Prompt N` por cada prompt.
- **Pega el prompt tal cual lo lanzaste**, dentro del bloque de código, aunque ocupe diez líneas
  y aunque tenga faltas. No lo reescribas para que quede bien: el que arreglaste mentalmente
  después no es el que lanzaste.
- Incluye también los que **no funcionaron**. Suelen ser los más útiles de leer.
- `Modelo` y `Herramienta` en todos. Si cambiaste de una a otra a mitad, se nota aquí.

Borra el ejemplo de abajo cuando escribas el primero.

---

## Prompt 1

**Modelo:** Opus 1M xHigh
**Herramienta:** Claude Code

```
Este es el ejemplo. Bórralo.

El prompt va aquí dentro, entero y con sus saltos de línea,
para que se sepa dónde empieza y dónde acaba.
```

**Qué salió:** (opcional, una línea) funcionó a la primera / tuve que insistir / me inventó una ruta que no existe.

---

## Prompt 2

**Modelo:** claude-opus-5-5
**Herramienta:** Claude Code (cli)
**Esfuerzo:** high
**Fecha y hora:** 2026-10-20 22:58:01 CST
**ID de sesión:** `1f55168d-ea76-4b7d-8e2f-33ec7387bb05`

```
Valida que exista un hook para registrar todos y cada uno de los promts que te enviaré, asi como las respuesta que me des.
```

### Respuesta a Prompt 2

*Finalizada: 2026-10-20 22:58:46 CST*

Ahora compruebo que de verdad ha registrado este prompt, y que las dependencias y el `.gitignore` están en orden.

Este prompt ya quedó registrado. La respuesta no la puedo ver escrita hasta que acabe el turno, así que pruebo el ciclo completo (prompt → respuesta) en una copia aislada en el scratchpad:

Sí: el hook existe, está bien configurado y funciona. Este mismo prompt ya está escrito en `prompts.md`.

**Cómo está montado**
- El script es `.claude/hooks/registrar-prompts.sh`. En `.claude/settings.json` está enganchado a cuatro eventos:
  - `UserPromptSubmit`: escribe cada prompt literal como `## Prompt N`, con modelo, herramienta, esfuerzo, fecha y sesión.
  - `Stop`: escribe tu respuesta como `### Respuesta a Prompt N`, con todo el texto y la lista de herramientas usadas.
  - `SessionStart` y `SessionEnd`: guardan el modelo y recuperan cualquier respuesta que se haya quedado sin registrar, por ejemplo si se corta la sesión.
- Solo añade al final de `prompts.md`; nunca borra lo que ya hay. No bloquea nada ni escribe en stdout, así que no altera lo que yo recibo.
- Tiene lo que necesita para funcionar: `jq` 1.8.1 y `flock` están instalados.

**Lo que he comprobado**
- **Prompt:** está en `prompts.md` como `## Prompt 2`, a continuación del ejemplo de la plantilla, con modelo `claude-opus-5-5` y la hora 22:58:01.
- **Respuesta:** esta no la puedo ver escrita hasta que acabe el turno, porque la añade `Stop` al terminar. Para no dejarlo sin probar, he hecho el ciclo completo en una copia aparte (prompt → respuesta, con un transcript simulado) en `/tmp/claude-1000/-mnt-c-Repositorios-flowsync-ai4devs-temp/1f55168d-ea76-4b7d-8e2f-33ec7387bb05/scratchpad/prueba-hook/prompts.md`. Salió bien: escribió la respuesta y la herramienta usada, y terminó con código 0.

**Dos cosas que conviene arreglar**
1. **`.claude/hooks/.estado-prompts/` no está en el `.gitignore`.** El comentario del script dice que está ignorada, pero no lo está: `git status` la muestra como fichero sin seguimiento. Si no se añade una línea `.claude/hooks/.estado-prompts/` al `.gitignore`, ese estado interno acabará colándose en un commit.
2. **Ni el script ni el cambio en `settings.json` están commiteados.** Ahora mismo el registro solo funciona en tu copia local. Si alguien clona el repo, no lo tendrá.

¿Añado la línea al `.gitignore` y lo commiteo todo junto en `interfaz-jccc`?

<details>
<summary>Herramientas usadas (3)</summary>

1. **Bash** — Revisar configuración de hooks y script de registro — <code>cat .claude/settings.json &amp;&amp; echo ---- &amp;&amp; cat .claude/hooks/registrar-prompts.sh &amp;&amp; echo ---- &amp;&amp; ls -la .claude/hooks/ .claude/hooks/.estado-prompts/ &amp;&amp; git diff .claude/settings.json; ls ~/.claude/settings.json 2&gt;/dev/null &amp;&amp; cat ~/.claude/settings.json; cat .claude/settings.local.json 2&gt;/dev/null</code>
2. **Bash** — Verificar estado, registro escrito y dependencias — <code>cat .claude/hooks/.estado-prompts/*.json; echo; echo ----; ls -la prompts.md; tail -n 25 prompts.md; echo ----; which jq flock; jq --version; echo ----; git check-ignore -v .claude/hooks/.estado-prompts/x.json prompts.md; git ls-files prompts.md; grep -n "estado-prompts\|prompts" .gitignore</code>
3. **Bash** — Probar el hook con un transcript simulado — <code>S=/tmp/claude-1000/-mnt-c-Repositorios-flowsync-ai4devs-temp/1f55168d-ea76-4b7d-8e2f-33ec7387bb05/scratchpad/prueba-hook; rm -rf "$S"; mkdir -p "$S"; T="$S/t.jsonl" ⏎ cat &gt;"$T" &lt;&lt;'EOF' ⏎ {"type":"user","promptId":"p1","timestamp":"2026-10-20T10:00:00Z","message":{"role":"user","content":"hola"}} ⏎ {…</code>

</details>

---

## Prompt 3

**Modelo:** claude-opus-5-5
**Herramienta:** Claude Code 2.1.304 (cli)
**Esfuerzo:** high
**Fecha y hora:** 2026-10-20 22:59:43 CST
**ID de sesión:** `1f55168d-ea76-4b7d-8e2f-33ec7387bb05`

```
sí, añádelo al .gitignore
```
