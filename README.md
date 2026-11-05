✍️ Ejercicio FlowSync: instrumenta el backend y escribe su objetivo de nivel de servicio 🔴

Repositorio: FlowSync

Es la última lección del módulo y la única que harás con el portátil delante. Aquí tienes cómo preparar el entorno, qué debes hacer y cómo entregar el ejercicio. Consta de tres partes: instrumentar el backend (Parte A), definir un objetivo de nivel de servicio (Parte B) y escribir tres líneas sobre lo que has observado (Parte C).

📌 Guarda cada prompt tal como lo envías, desde el primero. Forman parte de la entrega, así que no sirve reconstruirlos de memoria al terminar. Lo que se revisa es cómo se lo pediste al agente, no una versión corregida después. El repositorio ya incluye un archivo para guardarlos.

🔁 Cómo funciona este módulo
El ejercicio tiene tres etapas. Conviene saber qué harás en cada una:

1. Lo intentas tú. Trabajas sobre el proyecto que encontrarás más abajo, con tu agente y un tiempo limitado. Entrega lo que consigas, aunque esté incompleto. No se puntúa por terminarlo: en el directo se revisarán los problemas que encontraste.

2. Lo ves resuelto en el directo. El mentor instrumentará el mismo backend y definirá el mismo objetivo. Si no lo conseguiste, podrás ver cómo hacerlo. Por eso conviene mirar sin teclear: después tendrás tiempo para repetirlo.

3. Lo replicas. Recibirás por escrito los prompts del mentor para volver a tu entorno y repetir el proceso con calma.

⚠ En el paso 3 no esperes resultados idénticos. La inteligencia artificial (IA) no es determinista: incluso con el mismo prompt pueden cambiar los archivos modificados, la redacción del objetivo o la cantidad de trazas que aparecen en el destino. También hay otra fuente de variación: la primera traza suele no llegar, y averiguar por qué forma parte del ejercicio. Lo importante es repetir el proceso, no obtener exactamente la misma salida.

🛠 Deja el entorno listo
1. Comprueba lo que necesita tu máquina
Necesitas cuatro cosas. Compruébalas antes de clonar el proyecto para evitar errores posteriores:

Docker en ejecución: docker ps. Si aparece Cannot connect to the Docker daemon, comprueba que Docker esté instalado y arrancado. Puedes instalarlo desde https://docs.docker.com/get-started/get-docker/.

Node.js 24 o superior: node -v. La capa de base de datos exige Node.js 24 como mínimo. Con versiones anteriores, la instalación puede mostrar advertencias y el arranque fallar sin indicar claramente el motivo. Descárgalo desde https://nodejs.org.

make: make --version. Si no está instalado, en macOS puedes obtenerlo con las herramientas de línea de comandos (xcode-select --install); en Linux, con build-essential o su equivalente.

Una cuenta de GitHub: entregarás el ejercicio mediante un pull request desde tu propio fork al repositorio del curso.

💻 Compatibilidad con sistemas operativos. En macOS y Linux puedes seguir los comandos directamente. En Windows debes utilizar WSL (Windows Subsystem for Linux, el subsistema de Linux para Windows). Los atajos del proyecto utilizan comandos de shell como cp, test y rm. Aunque algunos existen en PowerShell, no tienen el mismo comportamiento y los atajos no funcionan allí tal como están escritos.

⚠ Todo debe estar dentro de WSL: el repositorio clonado, Node.js y make. Lo que instales en Windows no estará necesariamente disponible en esa terminal. Clona el proyecto dentro del sistema de archivos de Linux (~/…), no en /mnt/c, para evitar que la instalación de dependencias sea demasiado lenta.

📦 El destino de las trazas es pequeño y no tiene interfaz gráfica. Utilizarás el recolector de OpenTelemetry, con la imagen Docker otel/opentelemetry-collector-contrib:0.162.0. La descarga ronda los 100 MB (medición del 20 de octubre de 2026: 103 MB en Mac ARM y 113 MB en Intel).

Recibe trazas mediante el protocolo estándar y las escribe en sus propios registros con el exportador debug. Las consultarás con docker compose logs, no desde el navegador. Si quieres, descárgala antes de empezar con docker pull otel/opentelemetry-collector-contrib:0.162.0.

🔎 No necesitas instalar nada más para este ejercicio. El proyecto incluye los comandos necesarios. El analizador de seguridad se instalará más adelante, cuando repliques los prompts del mentor. Su instalación se explicará en el archivo que recibirás entonces.

2. Haz un fork y clona el proyecto
Trabajarás sobre tu propio fork, porque no tienes permisos de escritura en el repositorio del curso. Desde él abrirás el pull request de entrega.

Entra en https://github.com/LIDR-academy-temp/flowsync-ai4devs y pulsa Fork.

Clona tu fork y entra en la carpeta del proyecto.

Añade el repositorio del curso como upstream y descarga la rama de partida:

git remote add upstream https://github.com/LIDR-academy-temp/flowsync-ai4devs.git
git fetch upstream
git checkout -b s14/start upstream/s14/start
🚨 La rama de partida se obtiene de upstream, no de tu fork. El formulario de Fork de GitHub trae marcada la casilla de copiar solo la rama por defecto, así que tu fork se lleva main y nada más.

Si ejecutas git checkout s14/start sin haber descargado la rama, podrías recibir did not match any file(s) known to git, un error que no explica el problema del fork. Aunque copies todas las ramas, recuerda que un fork no incorpora automáticamente las ramas publicadas después.

3. Instala y arranca el proyecto
No hay un package.json en la raíz. Los comandos de npm se ejecutan dentro de backend/ y frontend/, pero el Makefile de la raíz ya se encarga de hacerlo.

make setup   # solo la primera vez: instala dependencias, crea los .env, levanta las bases y migra
make db-up   # levanta las dos bases de datos y espera a que estén sanas
make start   # levanta backend y frontend a la vez; Ctrl-C para los dos
make help    # lista todos los atajos
make start mantiene ocupada esa terminal, así que abre otra para las demás comprobaciones.

Hay un detalle importante para el ejercicio: debes arrancar la aplicación después de instrumentarla, porque la instrumentación se carga al iniciar el servidor. Si ya estaba funcionando, detenla con Ctrl-C y ejecuta de nuevo make start cuando el agente termine.

Comprueba que los servicios funcionan:

Backend: http://localhost:3333. Desde otra terminal, ejecuta curl -s http://localhost:3333.

Frontend: http://localhost:5173. Ábrelo en el navegador y regístrate. Después buscarás en las trazas el tráfico que generes.

Bases de datos: utilizan los puertos 54410 (desarrollo) y 54411 (pruebas). Se evita el 5432 para no entrar en conflicto con una instalación local de PostgreSQL.

Antes de modificar nada, ejecuta las pruebas del backend para comprobar que el entorno funciona:

make test        # migra la base de pruebas y corre la suite entera del backend
make test-unit   # solo la suite unitaria
make test-e2e    # solo la funcional: peticiones reales contra la API
Las tres comprueban el backend, incluida la API (Application Programming Interface), la interfaz que utiliza el frontend para comunicarse con el servidor.

4. Lo que NO hay antes de empezar
⚠ Todavía no hay instrumentación. El backend escribe registros con Pino, pero no exporta trazas, no propaga un identificador entre las operaciones de cada petición y no tiene configurado ningún destino para enviarlas.

Abre backend/bin/server.ts antes de empezar. La primera línea de ese archivo cambiará durante el ejercicio, así que conviene ver cómo estaba originalmente.

5. Crea tu rama
Trabaja en una rama propia, no directamente en s14/start. Créala antes de enviar el primer prompt con este nombre: git checkout -b slo-<tus-iniciales>. Si el agente guarda los commits en otra rama, incorpóralos a la tuya con git merge <esa-rama> antes de hacer push.

🔀 Si el agente crea otra rama, no significa que haya cometido un error. El proyecto le prohíbe hacer commits en s14/start, la rama de partida que contiene el código original del ejercicio, antes de tus cambios. Por eso, el agente puede crear una rama nueva para guardar sus commits.

Utiliza git branch y git log --oneline para comprobar dónde están los commits. git status puede aparecer limpio aunque el agente haya modificado varios archivos, porque los cambios ya están guardados en commits de otra rama.

📋 La tarea
Instrumenta el backend con OpenTelemetry, envía las trazas a un servicio que se ejecuta en tu máquina, comprueba que una petición tuya llega y define un objetivo de nivel de servicio para la API, con su ventana y presupuesto de error.

Es el mismo ejercicio que resolverá el mentor en el directo, sobre el mismo proyecto y con los mismos requisitos. Los prompts los escribes tú y forman parte de la entrega.

Trabajarás sobre el backend de FlowSync (backend/). Utilizarás el paquete oficial de AdonisJS, @adonisjs/otel, que se instala desde backend/ con node ace add @adonisjs/otel, no con npm install. Las trazas se enviarán a un recolector local de OpenTelemetry, configurado con el exportador debug como un servicio adicional de compose.yaml.

También definirás un objetivo de nivel de servicio (Service Level Objective, SLO) en docs/slo/api.md, exclusivamente para las rutas de /api/v1/tasks, con estos valores:

Indicador (Service Level Indicator, SLI): fracción de peticiones a esas rutas que responden con un código inferior a 500 y tardan menos de 500 milisegundos.

Objetivo: al menos el 99 % de esas peticiones deben cumplir el indicador durante una ventana móvil de 28 días.

Presupuesto de error: calcula cuántas peticiones pueden incumplir el objetivo, suponiendo 20.000 peticiones durante la ventana.

No cambies las rutas ni los valores. En el directo compararás tu resultado con el del mentor, así que ambos debéis trabajar con los mismos requisitos.

✋ El ejercicio termina cuando hayas escrito el objetivo. No pidas al agente que lea ni resuma los registros del recolector, no crees un subagente auditor ni modifiques la integración continua más allá de las tres variables indicadas. Esos pasos se verán en el directo.

🅰 Parte A: instrumenta el backend y comprueba las trazas
Abre tu agente en la raíz del proyecto.

Pídele que instrumente el backend con el paquete oficial y añada a compose.yaml un servicio llamado observability, utilizando la imagen otel/opentelemetry-collector-contrib:0.162.0. Debe publicar los puertos 4317 y 4318 y tener un archivo de configuración con un receptor otlp para ambos protocolos y un exportador debug con verbosity: detailed en la tubería de trazas.

Con detailed, cada tramo muestra su identificador de traza, nombre y horas de inicio y fin. El nivel predeterminado solo muestra un recuento. El nombre del servicio importa, porque docker compose up -d observability permite arrancarlo sin tocar las bases de datos.

Arranca el recolector y, después de instrumentar el backend, ejecuta make start. Genera tráfico desde el navegador: regístrate, crea dos tareas y cambia el estado de una.

Comprueba las trazas con docker compose logs observability. Cada bloque identifica el servicio de origen (service.name: Str(flowsync-api)). Los tramos comienzan por Span # e incluyen Trace ID, Name, Kind, Start time y End time.

Anota cuántas trazas distintas llegaron: docker compose logs observability | grep "Trace ID" | sort -u | wc -l

Busca una petición a /api/v1/tasks y comprueba dónde se consumió el tiempo. Compara la duración del tramo de la petición (Kind: Server) con la de sus consultas a la base de datos.

Hay tres detalles que debes vigilar:

La importación debe ser la primera línea. El instalador añade import '../otel.js' al principio de backend/bin/server.ts. Si el agente la mueve o carga otros módulos antes, la instrumentación puede no activarse. No aparece ningún error, pero tampoco llegan trazas.

Tres variables nuevas en todos los entornos. El instalador añade APP_NAME, APP_VERSION y APP_ENV a la validación. Deben estar en backend/.env, backend/.env.example, backend/.env.test y en el bloque env: de .github/workflows/openapi.yml, que arranca la aplicación en cada pull request. Si falta alguna, el arranque falla y la comprobación del pull request aparece en rojo. Utiliza APP_NAME=flowsync-api para identificar el servicio en las trazas.

El puerto correcto. Configura OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 en backend/.env. El puerto 4318 corresponde a OTLP mediante HTTP; el 4317 utiliza gRPC, un protocolo de llamadas remotas entre servicios. Si utilizas el puerto incorrecto, las trazas pueden no llegar sin mostrar un error evidente.

Respeta estas tres restricciones:

Instala el paquete con el comando del framework, no con npm install. La instalación manual no genera ni registra todos los componentes necesarios.

No modifiques el frontend. Este ejercicio se centra en el backend.

No corrijas manualmente los problemas. Si no llegan las trazas, pide al agente que investigue la causa. Guarda también ese prompt en prompts.md: puede ser uno de los más interesantes de revisar.

🅱 Parte B: define el objetivo de nivel de servicio
Pide al agente que escriba el SLO en docs/slo/api.md con los valores indicados. El documento debe incluir cuatro elementos:

El indicador como fracción, con numerador y denominador, utilizando la ruta, el código de respuesta y la duración de cada petición.

El objetivo del 99 % y su ventana móvil de 28 días.

El presupuesto de error expresado en peticiones, calculado con el volumen supuesto de 20.000 peticiones. Debe quedar claro que ese volumen se sustituirá por el real.

Una única alerta basada en un problema que percibe el usuario, no en una causa interna. Debe avisar cuando el ritmo de consumo del presupuesto indique que se agotará antes de terminar la ventana.

También debe indicar expresamente qué rutas quedan fuera del objetivo: todas las que no pertenezcan a /api/v1/tasks, como el registro y el inicio de sesión. Si necesitas medirlas, deberán tener su propio objetivo y presupuesto.

Parte C: escribe tus tres hallazgos
En la raíz del repositorio, crea HALLAZGOS.md o vacíalo si ya existe. Escribe tres líneas:

Cuántas trazas aparecieron y qué tramo consumió más tiempo en la más lenta, utilizando los datos que anotaste.

Qué cambiaste para conseguir que llegaran. Si al principio no aparecieron, explica cuál era el problema. Si funcionó al primer intento, indícalo también.

Cuánto presupuesto de error obtuviste, expresado en peticiones, y si te parece mucho o poco para un mes de uso real de FlowSync.

No necesitas una instrumentación perfecta para entregar. Una Parte A incompleta, acompañada de los tres hallazgos, permite revisar qué ocurrió y dónde encontraste dificultades.

Cómo comprobar que has terminado
Has visto trazas reales en el recolector y anotado cuántas llegaron. Si no apareció ninguna, has documentado qué intentaste.

La importación de OpenTelemetry sigue siendo la primera línea de backend/bin/server.ts.

Las tres variables nuevas están en los tres archivos de entorno y en el workflow que arranca la aplicación.

El SLO incluye sus cuatro elementos, con el presupuesto expresado en peticiones.

El documento indica qué rutas quedan fuera del objetivo.

No has modificado el frontend. Compruébalo con git diff --stat.

Entrega lo que hayas conseguido, aunque esté incompleto.

📤 Cómo se entrega
Trabaja en la rama slo-<tus-iniciales>, creada durante la preparación del entorno. No utilices s14/start, que es la rama de partida del ejercicio.

Guarda todos tus prompts en prompts.md, en la raíz del repositorio. El archivo ya incluye una plantilla. Conserva exactamente ese nombre y ubicación porque la herramienta de revisión los utiliza. Escribe cada prompt en su propio bloque de código, indicando el modelo y la herramienta que usaste.

Sube tu rama al fork (git push -u origin slo-<tus-iniciales>) y abre un pull request desde tu fork hacia el repositorio del curso (github.com/LIDR-academy-temp/flowsync-ai4devs). Comprueba que GitHub haya seleccionado el repositorio del curso como destino, no tu fork. El cambio debe incluir HALLAZGOS.md, docs/slo/api.md y prompts.md. No incluyas backend/.env: está ignorado por Git y debe seguir así.

El plazo
Debes entregar el ejercicio antes del directo.

📚 Si vas justo de tiempo
Prioriza la lección sobre la diferencia entre monitorizar y observar, que te ayudará a interpretar las trazas, y la que explica por qué una alerta útil describe lo que percibe el usuario y no la causa interna del fallo. Las otras tres pueden esperar.

Si tienes muy poco tiempo, céntrate en la Parte B. Puedes definir el SLO aunque no hayas conseguido recibir trazas. Documentar por qué no llegaron también forma parte del ejercicio.

✅ Antes de conectarte, comprueba
[ ] Estás trabajando en tu fork, en la rama slo-<tus-iniciales>, creada a partir de s14/start, y git push funciona.

[ ] docker ps devuelve una tabla, node -v muestra la versión 24 o superior y make --version responde.

[ ] El recolector arranca correctamente. docker compose logs observability muestra Everything is ready. Begin running and processing data.

[ ] Has generado tráfico desde el navegador: registro, dos tareas nuevas y un cambio de estado.

[ ] Has anotado cuántas trazas aparecieron y qué tramo consumió más tiempo en la más lenta. Si no apareció ninguna, has documentado qué probaste.

[ ] HALLAZGOS.md contiene las tres líneas y docs/slo/api.md está incluido en los cambios. backend/.env no está incluido.

[ ] prompts.md contiene todos tus prompts, con el modelo y la herramienta utilizados.

[ ] Has abierto el pull request desde slo-<tus-iniciales> hacia el repositorio del curso.

Trae los archivos tal como quedaron, sin corregirlos después: los problemas que encontraste también son parte de lo que revisaremos.

🎯 Qué te llevas del Módulo 14
El modelo mental: monitorizar permite responder preguntas previstas; observar, investigar preguntas nuevas sin desplegar cambios. Lo que podrás analizar mañana depende de los datos que guardes hoy.

Con OpenTelemetry, la instrumentación y el destino de las trazas son independientes. Puedes instrumentar una vez y cambiar el destino mediante una variable de entorno. Las alertas avisan de problemas que afectan al usuario, mientras que las trazas ayudan a identificar sus causas. Un SLO permite medir la fiabilidad mediante un indicador, una ventana y un presupuesto de error.

En seguridad, cada herramienta automática detecta determinadas clases de fallos, pero las reglas de negocio deben definirse antes de escribir el código. También debes comprobar las licencias de las herramientas y qué información envían fuera de tu máquina.

Lo que queda en el proyecto: un backend instrumentado con el paquete oficial de AdonisJS y configurado para enviar trazas mediante una variable de entorno. Un servicio observability en compose.yaml que recibe las trazas y las escribe en sus registros locales.

También tendrás un SLO en docs/slo/api.md, con su indicador, ventana, presupuesto de error y alerta; un archivo HALLAZGOS.md con tus tres observaciones y un prompts.md con las instrucciones que enviaste al agente.

👥 Qué te llevas según tu perfil

Si eres dev: aprenderás a relacionar registros estructurados mediante identificadores de traza, instrumentar con el paquete oficial, configurar un destino y definir un SLO para una operación importante. También comprobarás las licencias de las herramientas que incorporas al desarrollo.

Si vienes de producto o gestión: el presupuesto de error permite evaluar cuánto riesgo puede asumir el producto. Las reglas de negocio deben quedar escritas antes de implementar las funcionalidades, porque los analizadores automáticos no pueden deducirlas. Utilizar un protocolo estándar también facilita cambiar de proveedor.

Si no tienes experiencia técnica: entenderás por qué una media puede ocultar los casos problemáticos que afectan a los usuarios. Un sistema puede mostrar métricas internas correctas mientras las personas encuentran errores o abandonan una compra.