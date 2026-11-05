# Hallazgos

Aquí van **las tres líneas** del ejercicio, una por cada punto de abajo. Es lo único que hay que
traer hecho: un cambio de motor a medias con estas tres líneas escritas vale más que lo contrario,
porque lo que se discute en el directo es dónde te chocaste.

Escribe **una sola línea por punto**, con tus palabras y con lo que mediste, no con lo que suponías.

## 1. Cuántas trazas aparecieron y qué tramo consumió más tiempo en la más lenta, utilizando los datos que anotaste.

Aparecieron 10 trazas y el traza que más consumio tiempo fue GET /api/v1/tasks con 627ms pero el tramo más lento fue select flowsync.auth_access_tokens, con 344,7 ms, más de la mitad de la petición.

-

## 2. Qué cambiaste para conseguir que llegaran. Si al principio no aparecieron, explica cuál era el problema. Si funcionó al primer intento, indícalo también.

No cambie nada, desde el primer intento se comenzó a mostrar la información

-

## 3. Cuánto presupuesto de error obtuviste, expresado en peticiones, y si te parece mucho o poco para un mes de uso real de FlowSync.

Las peticiones del presupuesto original era de 20,000 para 1 mes, aproximadamente el 1%, es decir 200 peticiones diarias, dependiendo del uso de la plataforma, quizás haya que incrementar el presupuesto original, ya que tan sólo en este ejercicio se obtuvo 1 petición de error.

-
