/**
 * Genera lib/evolucionCatalogo.js desde datos estructurados.
 * Ejecutar: node scripts/build-evolucion-catalog.js
 */
'use strict';
const fs = require('fs');
const path = require('path');

function slug(s) {
  return String(s).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function buildMatriz(id, titulo, categoriasRaw) {
  const categorias = categoriasRaw.map(([catId, catTitulo, items]) => ({
    id: catId,
    titulo: catTitulo,
    items: items.map(label => ({
      key: `${id}.${catId}.${slug(label)}`,
      label
    }))
  }));
  const totalItems = categorias.reduce((n, c) => n + c.items.length, 0);
  return { id, titulo, categorias, totalItems };
}

const RAW = {
  mozo: buildMatriz('mozo', 'Mozo / Atención en salón', [
    ['conocimiento_negocio', 'Conocimiento del negocio', [
      'Conoce toda la carta.', 'Conoce los ingredientes de cada producto.', 'Conoce promociones vigentes.',
      'Conoce precios sin consultar.', 'Conoce bebidas y acompañamientos.', 'Recomienda productos adecuadamente.',
      'Responde preguntas de clientes con seguridad.', 'Conoce protocolos de higiene.'
    ]],
    ['atencion_cliente', 'Atención al cliente', [
      'Saluda inmediatamente al cliente.', 'Sonríe y mantiene buena actitud.', 'Escucha atentamente.',
      'Mantiene contacto visual.', 'Resuelve reclamos sin discutir.', 'Hace seguimiento a las mesas.',
      'Detecta clientes insatisfechos.', 'Se despide cordialmente.', 'Recuerda clientes frecuentes.',
      'Genera una experiencia agradable.'
    ]],
    ['ventas', 'Ventas', [
      'Sugiere bebidas.', 'Sugiere postres.', 'Sugiere adicionales.', 'Incrementa el ticket promedio.',
      'Logra ventas complementarias.', 'Convence sin presionar.', 'Promueve promociones.',
      'Genera repetición de compra.', 'Obtiene comentarios positivos.', 'Fideliza clientes.'
    ]],
    ['velocidad', 'Velocidad', [
      'Atiende rápidamente.', 'Toma pedidos sin errores.', 'Entrega pedidos completos.', 'Lleva pedidos a tiempo.',
      'Cobra rápidamente.', 'Mantiene mesas atendidas.', 'Reduce tiempos de espera.',
      'Atiende varias mesas simultáneamente.'
    ]],
    ['organizacion', 'Organización', [
      'Mantiene limpia su zona.', 'Mantiene mesas limpias.', 'Mantiene utensilios ordenados.',
      'Mantiene abastecida su estación.', 'Cumple procedimientos.', 'Mantiene uniforme impecable.'
    ]],
    ['trabajo_equipo', 'Trabajo en equipo', [
      'Ayuda a compañeros.', 'Apoya en momentos de alta demanda.', 'Mantiene buena comunicación.',
      'Colabora con cocina.', 'Colabora con caja.', 'Acepta correcciones.', 'Propone mejoras.',
      'Mantiene actitud positiva.'
    ]],
    ['responsabilidad', 'Responsabilidad', [
      'Llega puntual.', 'Cumple horarios.', 'Cuida equipos.', 'Cuida productos.',
      'No genera desperdicios.', 'Cumple indicaciones.', 'Tiene iniciativa.', 'Es confiable.'
    ]],
    ['kpi', 'Indicadores de desempeño (KPI)', [
      'Ventas promedio por cliente.', 'Ticket promedio.', 'Clientes atendidos por turno.',
      'Quejas recibidas.', 'Comentarios positivos.', 'Clientes que regresan.',
      'Tiempo promedio de atención.', 'Errores en pedidos.', 'Ventas de adicionales.', 'Cumplimiento de metas.'
    ]]
  ]),

  cajero: buildMatriz('cajero', 'Cajero – Matriz de habilidades', [
    ['conocimiento_negocio', 'Conocimiento del negocio', [
      'Conoce toda la carta.', 'Conoce todos los precios.', 'Conoce promociones vigentes.',
      'Conoce combos y paquetes.', 'Conoce los ingredientes de cada producto.', 'Conoce los tiempos de preparación.',
      'Conoce políticas de cambios y devoluciones.', 'Conoce protocolos de atención.', 'Conoce métodos de pago.',
      'Conoce procedimientos de apertura y cierre.'
    ]],
    ['manejo_caja', 'Manejo de caja', [
      'Realiza aperturas de caja correctamente.', 'Realiza cierres sin diferencias.', 'Maneja efectivo correctamente.',
      'Maneja POS correctamente.', 'Maneja Yape y Plin correctamente.', 'Entrega vuelto exacto.',
      'Detecta billetes falsos.', 'Registra todas las ventas.', 'Evita pérdidas de dinero.', 'Mantiene orden documental.'
    ]],
    ['atencion_cliente', 'Atención al cliente', [
      'Saluda cordialmente.', 'Sonríe al atender.', 'Mantiene paciencia.', 'Escucha al cliente.',
      'Resuelve dudas rápidamente.', 'Resuelve reclamos adecuadamente.', 'Mantiene buena presentación.',
      'Se despide cordialmente.', 'Atiende con rapidez.', 'Mantiene actitud positiva.'
    ]],
    ['ventas', 'Ventas', [
      'Sugiere bebidas.', 'Sugiere postres.', 'Sugiere extras.', 'Sugiere productos premium.',
      'Promueve promociones.', 'Incrementa ticket promedio.', 'Identifica oportunidades de venta.',
      'Convence sin insistir demasiado.', 'Fideliza clientes.', 'Genera recompra.'
    ]],
    ['precision_control', 'Precisión y control', [
      'Ingresa pedidos sin errores.', 'Registra productos correctamente.', 'Evita anulaciones innecesarias.',
      'Verifica montos antes de cobrar.', 'Verifica cambios de precios.', 'Revisa comprobantes emitidos.',
      'Mantiene control de pedidos pendientes.', 'Minimiza errores operativos.', 'Cumple procedimientos.',
      'Cuida información sensible.'
    ]],
    ['velocidad', 'Velocidad', [
      'Atiende rápidamente.', 'Cobra rápidamente.', 'Emite comprobantes rápidamente.',
      'Atiende horas punta eficientemente.', 'Gestiona colas adecuadamente.', 'Prioriza tareas correctamente.',
      'Responde consultas rápidamente.', 'Mantiene fluidez en atención.'
    ]],
    ['organizacion', 'Organización', [
      'Mantiene área limpia.', 'Mantiene documentos ordenados.', 'Mantiene caja organizada.',
      'Mantiene insumos de trabajo disponibles.', 'Reporta faltantes.', 'Mantiene escritorio ordenado.',
      'Cumple checklists diarios.'
    ]],
    ['trabajo_equipo', 'Trabajo en equipo', [
      'Ayuda a los mozos.', 'Coordina bien con cocina.', 'Coordina bien con delivery.',
      'Coordina bien con administración.', 'Mantiene buena comunicación.', 'Apoya en momentos de alta demanda.',
      'Acepta correcciones.', 'Propone mejoras.'
    ]],
    ['responsabilidad', 'Responsabilidad', [
      'Llega puntual.', 'Cumple horarios.', 'Cumple procedimientos.', 'Cuida equipos.',
      'Cuida información de ventas.', 'Mantiene confidencialidad.', 'Demuestra honestidad.'
    ]],
    ['kpi', 'Indicadores (KPI)', [
      'Diferencia de caja (S/).', 'Errores de cobro.', 'Errores de digitación.', 'Tiempo promedio de atención.',
      'Número de anulaciones.', 'Ticket promedio.', 'Venta de adicionales.', 'Venta de bebidas.',
      'Venta de postres.', 'Cumplimiento de metas.', 'Reclamos recibidos.', 'Comentarios positivos.',
      'Clientes recurrentes.', 'Tiempo de respuesta.', 'Exactitud en cierres de caja.',
      'Exactitud en emisión de comprobantes.', 'Cumplimiento de procedimientos.'
    ]]
  ]),

  planchero: buildMatriz('planchero', 'Planchero (Armado y salida de sánguches)', [
    ['conocimiento_producto', 'Conocimiento del producto', [
      'Conoce toda la carta.', 'Conoce las recetas exactas.', 'Conoce las porciones correctas.',
      'Conoce los estándares de BELÚ.', 'Identifica cada tipo de sándwich rápidamente.',
      'Conoce los acompañamientos de cada producto.', 'Conoce las promociones vigentes.',
      'Conoce los procedimientos de producción.', 'Conoce los tiempos de preparación.',
      'Identifica errores antes de despachar.'
    ]],
    ['calidad_producto', 'Calidad del producto', [
      'Mantiene el mismo sabor siempre.', 'Respeta gramajes.', 'Respeta recetas.', 'Mantiene buena presentación.',
      'Entrega productos completos.', 'Verifica calidad del pan.', 'Verifica calidad del chicharrón.',
      'Verifica calidad de la zarza.', 'Verifica calidad de salsas.', 'Corrige productos defectuosos.'
    ]],
    ['velocidad_produccion', 'Velocidad de producción', [
      'Arma sándwiches rápidamente.', 'Mantiene ritmo constante.', 'Trabaja bien bajo presión.',
      'Reduce tiempos muertos.', 'Prioriza pedidos correctamente.', 'Cumple tiempos objetivo.',
      'Mantiene fluidez en horas punta.', 'Atiende múltiples pedidos simultáneamente.',
      'Evita cuellos de botella.', 'Mantiene productividad durante todo el turno.'
    ]],
    ['precision', 'Precisión', [
      'No confunde pedidos.', 'No omite ingredientes.', 'Respeta modificaciones del cliente.',
      'Lee correctamente comandas.', 'Verifica pedidos antes de entregar.', 'Minimiza reprocesos.',
      'Reduce devoluciones.', 'Reduce errores operativos.', 'Entrega pedidos exactos.',
      'Cumple estándares sin supervisión.'
    ]],
    ['organizacion_estacion', 'Organización de estación', [
      'Mantiene la mesa ordenada.', 'Mantiene ingredientes organizados.', 'Mantiene utensilios en su lugar.',
      'Repone productos a tiempo.', 'Mantiene limpieza constante.', 'Identifica faltantes rápidamente.',
      'Reporta insumos bajos.', 'Evita acumulación de desorden.', 'Mantiene flujo eficiente de trabajo.',
      'Sigue procedimientos de limpieza.'
    ]],
    ['control_desperdicios', 'Control de desperdicios', [
      'Evita exceso de porciones.', 'Reduce desperdicio de pan.', 'Reduce desperdicio de chicharrón.',
      'Reduce desperdicio de zarza.', 'Reduce desperdicio de salsas.', 'Aprovecha correctamente los insumos.',
      'Cuida el costo de producción.', 'Mantiene control de mermas.', 'Reporta pérdidas.',
      'Trabaja con mentalidad de ahorro.'
    ]],
    ['higiene_inocuidad', 'Higiene e inocuidad', [
      'Mantiene manos limpias.', 'Usa uniforme correctamente.', 'Mantiene área higiénica.',
      'Evita contaminación cruzada.', 'Manipula alimentos correctamente.', 'Cumple protocolos sanitarios.',
      'Mantiene utensilios limpios.', 'Mantiene superficies limpias.', 'Cumple controles de calidad.',
      'Respeta normas de seguridad alimentaria.'
    ]],
    ['trabajo_equipo', 'Trabajo en equipo', [
      'Coordina con cocina.', 'Coordina con mozos.', 'Coordina con cajero.', 'Coordina con despacho.',
      'Ayuda a compañeros.', 'Mantiene buena comunicación.', 'Acepta correcciones.',
      'Capacita a nuevos colaboradores.', 'Mantiene actitud positiva.', 'Colabora en momentos críticos.'
    ]],
    ['responsabilidad', 'Responsabilidad', [
      'Llega puntual.', 'Cumple horarios.', 'Cuida equipos.', 'Cuida planchas y herramientas.',
      'Sigue procedimientos.', 'Mantiene disciplina.', 'Tiene iniciativa.', 'Cumple metas de producción.',
      'Mantiene compromiso con la calidad.', 'Es confiable.'
    ]],
    ['kpi', 'KPI (Indicadores del planchero)', [
      'Sándwiches producidos por hora.', 'Pedidos terminados por turno.', 'Tiempo promedio por pedido.',
      'Tiempo en hora punta.', 'Reclamos por producto.', 'Devoluciones.', 'Errores de armado.',
      'Cumplimiento de receta.', 'Desperdicio de insumos.', 'Merma de chicharrón.', 'Merma de pan.',
      'Uso correcto de porciones.', 'Limpieza de estación.', 'Cumplimiento de procedimientos.',
      'Puntualidad.', 'Trabajo en equipo.'
    ]]
  ]),

  cantor: buildMatriz('cantor', 'Cantor – Matriz de habilidades', [
    ['lectura_comandas', 'Lectura y control de comandas', [
      'Lee comandas rápidamente.', 'Interpreta correctamente los pedidos.', 'Identifica modificaciones especiales.',
      'Detecta errores en pedidos.', 'Prioriza pedidos según orden.', 'Evita confusiones entre comandas.',
      'Mantiene secuencia correcta.', 'Verifica pedidos antes de cantar.', 'Coordina con caja cuando hay dudas.',
      'Reduce errores de comunicación.'
    ]],
    ['comunicacion', 'Comunicación', [
      'Canta pedidos claramente.', 'Tiene buena dicción.', 'Habla fuerte y entendible.',
      'Mantiene calma bajo presión.', 'Coordina bien con plancha.', 'Coordina con cocina.',
      'Coordina con despacho.', 'Coordina con mozos.', 'Transmite cambios correctamente.',
      'Mantiene comunicación constante.'
    ]],
    ['abastecimiento_plancha', 'Abastecimiento de plancha', [
      'Mantiene pan disponible.', 'Mantiene chicharrón disponible.', 'Mantiene zarza disponible.',
      'Mantiene camote disponible.', 'Mantiene salsas disponibles.', 'Anticipa faltantes.',
      'Repone antes de que se agoten.', 'Mantiene flujo continuo.', 'Evita que la plancha se detenga.',
      'Organiza insumos eficientemente.'
    ]],
    ['velocidad_operativa', 'Velocidad operativa', [
      'Reacciona rápido.', 'Mantiene ritmo constante.', 'Atiende varios pedidos simultáneamente.',
      'Prioriza correctamente.', 'Reduce tiempos muertos.', 'Mantiene producción fluida.',
      'Trabaja bien en horas punta.', 'Resuelve cuellos de botella.', 'Anticipa necesidades.',
      'Mantiene continuidad operativa.'
    ]],
    ['organizacion', 'Organización', [
      'Mantiene estación ordenada.', 'Organiza comandas.', 'Organiza insumos.', 'Organiza utensilios.',
      'Mantiene áreas despejadas.', 'Evita acumulaciones.', 'Mantiene limpieza constante.',
      'Identifica desorden rápidamente.', 'Sigue procedimientos.', 'Mantiene disciplina operativa.'
    ]],
    ['lavado_limpieza', 'Lavado y limpieza', [
      'Aprovecha tiempos muertos.', 'Lava utensilios oportunamente.', 'Lava tablas y recipientes.',
      'Mantiene limpieza general.', 'Mantiene áreas sanitizadas.', 'Evita acumulación de vajilla.',
      'Cumple protocolos de higiene.', 'Mantiene implementos limpios.', 'Colabora con limpieza general.',
      'Mantiene orden permanente.'
    ]],
    ['trabajo_equipo', 'Trabajo en equipo', [
      'Ayuda al planchero.', 'Ayuda a cocina.', 'Ayuda a despacho.', 'Ayuda a mozos.',
      'Tiene actitud colaborativa.', 'Mantiene respeto.', 'Acepta correcciones.',
      'Capacita a nuevos colaboradores.', 'Mantiene actitud positiva.', 'Colabora en emergencias.'
    ]],
    ['responsabilidad', 'Responsabilidad', [
      'Llega puntual.', 'Cumple horarios.', 'Sigue instrucciones.', 'Cuida equipos.', 'Cuida insumos.',
      'Evita desperdicios.', 'Reporta problemas.', 'Tiene iniciativa.', 'Cumple procedimientos.', 'Es confiable.'
    ]],
    ['kpi', 'KPI del cantor', [
      'Errores de lectura de comandas.', 'Pedidos confundidos.', 'Pedidos omitidos.', 'Tiempo de respuesta.',
      'Veces que la plancha quedó desabastecida.', 'Tiempo de reposición de insumos.',
      'Fluidez operativa durante horas punta.', 'Pedidos procesados por hora.', 'Cumplimiento de lavado.',
      'Estado de orden de la estación.', 'Cumplimiento de protocolos de limpieza.',
      'Evaluación del planchero.', 'Evaluación del cocinero.', 'Evaluación del administrador.'
    ]]
  ]),

  ayudante_cocina: buildMatriz('ayudante_cocina', 'Ayudante de cocina – Matriz de habilidades', [
    ['preparacion_insumos', 'Preparación de insumos', [
      'Pela camote correctamente.', 'Corta camote con tamaño uniforme.', 'Selecciona camote de buena calidad.',
      'Lava insumos correctamente.', 'Prepara cebolla para zarza.', 'Corta cebolla de manera uniforme.',
      'Prepara limón y condimentos.', 'Prepara salsas según receta.',
      'Mantiene insumos listos antes de horas punta.', 'Sigue recetas y procedimientos.',
      'Prepara hamburguesa.', 'Prepara el ASADO.', 'Prepara pollo.',
      'Prepara el caldo para la sopa especial.', 'Prepara la mayonesa.'
    ]],
    ['produccion_chicharron', 'Producción de chicharrón', [
      'Conoce el proceso de cocción.', 'Controla tiempos de cocción.', 'Controla temperatura.',
      'Identifica punto correcto del chicharrón.', 'Obtiene textura adecuada.', 'Obtiene color adecuado.',
      'Evita sobrecocción.', 'Evita productos quemados.', 'Mantiene calidad constante.',
      'Aprovecha correctamente la materia prima.'
    ]],
    ['produccion_camote', 'Producción de camote frito', [
      'Fríe camote correctamente.', 'Controla temperatura del aceite.', 'Obtiene color uniforme.',
      'Obtiene textura crocante.', 'Evita camotes quemados.', 'Evita camotes crudos.',
      'Mantiene producción constante.', 'Calcula cantidades necesarias.', 'Reduce desperdicio.',
      'Mantiene calidad uniforme.'
    ]],
    ['abastecimiento', 'Abastecimiento', [
      'Mantiene stock de camote.', 'Mantiene stock de cebolla.', 'Mantiene stock de chicharrón.',
      'Mantiene stock de asado.', 'Mantiene stock de pollo.', 'Mantiene stock de aji.',
      'Mantiene stock de mayonesa.', 'Mantiene stock de cremas.', 'Anticipa necesidades.',
      'Reporta faltantes.', 'Evita quiebres de stock.', 'Mantiene producción adelantada.',
      'Coordina con plancha.', 'Coordina con cantor.', 'Coordina con administración.'
    ]],
    ['velocidad_productividad', 'Velocidad y productividad', [
      'Trabaja con rapidez.', 'Cumple tiempos de producción.', 'Aprovecha tiempos muertos.',
      'Mantiene ritmo constante.', 'Prioriza tareas correctamente.', 'Trabaja bien bajo presión.',
      'Cumple metas diarias.', 'Mantiene productividad durante todo el turno.',
      'Responde rápidamente a pedidos urgentes.', 'Evita retrasos en producción.'
    ]],
    ['control_calidad', 'Control de calidad', [
      'Verifica calidad del camote.', 'Verifica calidad de la cebolla.', 'Verifica calidad del chicharrón.',
      'Verifica calidad del asado.', 'Verifica calidad del pollo.', 'Detecta productos defectuosos.',
      'Corrige errores antes de servir.', 'Mantiene estándares BELÚ.', 'Sigue fichas técnicas.',
      'Respeta gramajes.', 'Mantiene uniformidad.', 'Cuida la presentación de insumos.'
    ]],
    ['limpieza_higiene', 'Limpieza e higiene', [
      'Mantiene área limpia.', 'Lava utensilios correctamente.', 'Lava recipientes oportunamente.',
      'Mantiene pisos limpios.', 'Mantiene freidoras limpias.', 'Mantiene tablas limpias.',
      'Evita contaminación cruzada.', 'Usa uniforme correctamente.', 'Cumple protocolos sanitarios.',
      'Mantiene orden permanente.'
    ]],
    ['control_desperdicios', 'Control de desperdicios', [
      'Reduce merma de camote.', 'Reduce merma de cebolla.', 'Reduce merma de chicharrón.',
      'Reduce merma de asado.', 'Reduce merma de pollo.', 'Reduce merma de hamburguesa.',
      'Aprovecha correctamente insumos.', 'Reporta pérdidas.', 'Controla consumo de aceite.',
      'Evita excesos de producción.', 'Cuida los costos.', 'Usa correctamente herramientas.',
      'Mantiene mentalidad de ahorro.'
    ]],
    ['trabajo_equipo_actitud', 'Trabajo en equipo y actitud', [
      'Ayuda a compañeros.', 'Mantiene buena comunicación.', 'Sigue instrucciones.', 'Acepta correcciones.',
      'Tiene iniciativa.', 'Mantiene actitud positiva.', 'Colabora en horas punta.', 'Se adapta a cambios.',
      'Es respetuoso.', 'Es confiable.'
    ]],
    ['kpi', 'KPI del ayudante de cocina', [
      'Kilos de chicharrón producidos.', 'Kilos de camote preparados.', 'Cantidad de zarza preparada.',
      'Tiempo de preparación.', 'Reclamos por calidad.', 'Productos quemados.', 'Productos crudos.',
      'Cumplimiento de estándares.', 'Veces que faltó camote.', 'Veces que faltó zarza.',
      'Veces que faltó chicharrón.', 'Tiempo de reposición.', 'Merma de camote (%).',
      'Merma de cebolla (%).', 'Merma de chicharrón (%).', 'Consumo de aceite.',
      'Evaluación de orden.', 'Evaluación de higiene.', 'Cumplimiento de protocolos.'
    ]]
  ]),

  liquidos: buildMatriz('liquidos', 'Encargado de líquidos / jugos', [
    ['conocimiento_productos', 'Conocimiento de productos', [
      'Conoce toda la carta de bebidas.', 'Conoce todas las recetas.', 'Conoce las medidas exactas.',
      'Conoce las promociones vigentes.', 'Identifica cada bebida rápidamente.',
      'Conoce ingredientes y combinaciones.', 'Conoce tiempos de preparación.',
      'Conoce estándares de presentación.', 'Conoce procedimientos de higiene.', 'Conoce control de insumos.'
    ]],
    ['preparacion_jugos', 'Preparación de jugos', [
      'Respeta recetas.', 'Mantiene sabor uniforme.', 'Mantiene textura adecuada.', 'Mantiene temperatura adecuada.',
      'Utiliza cantidades correctas.', 'Mide correctamente azúcar o endulzantes.',
      'Mide correctamente agua o leche.', 'Prepara pedidos sin errores.', 'Mantiene calidad constante.',
      'Cumple estándares BELÚ.'
    ]],
    ['velocidad_preparacion', 'Velocidad de preparación', [
      'Prepara bebidas rápidamente.', 'Atiende varios pedidos simultáneamente.', 'Mantiene ritmo constante.',
      'Trabaja bien en horas punta.', 'Reduce tiempos de espera.', 'Prioriza correctamente.',
      'Responde a pedidos urgentes.', 'Mantiene flujo continuo.', 'Evita acumulación de pedidos.',
      'Aprovecha tiempos muertos.'
    ]],
    ['calidad_producto', 'Calidad del producto', [
      'Verifica sabor antes de entregar.', 'Verifica presentación.', 'Verifica temperatura.',
      'Verifica cantidades.', 'Evita bebidas aguadas.', 'Evita bebidas demasiado concentradas.',
      'Mantiene uniformidad.', 'Corrige errores antes de entregar.', 'Minimiza reclamos.',
      'Cuida la imagen del producto.'
    ]],
    ['control_insumos', 'Control de insumos', [
      'Controla frutas.', 'Controla leche.', 'Controla azúcar.', 'Controla hielo.', 'Controla café.',
      'Controla envases.', 'Reporta faltantes.', 'Anticipa necesidades.', 'Evita desperdicios.',
      'Mantiene stock suficiente.'
    ]],
    ['limpieza_higiene', 'Limpieza e higiene', [
      'Mantiene licuadoras limpias.', 'Mantiene estación limpia.', 'Lava utensilios oportunamente.',
      'Mantiene superficies limpias.', 'Manipula alimentos correctamente.', 'Usa uniforme correctamente.',
      'Cumple protocolos sanitarios.', 'Evita contaminación cruzada.', 'Mantiene orden constante.',
      'Mantiene buena presentación personal.'
    ]],
    ['control_desperdicios', 'Control de desperdicios', [
      'Reduce desperdicio de fruta.', 'Reduce desperdicio de leche.', 'Reduce desperdicio de hielo.',
      'Reduce desperdicio de insumos.', 'Aprovecha correctamente los productos.', 'Cuida costos.',
      'Respeta porciones.', 'Reporta pérdidas.', 'Evita sobreproducción.', 'Mantiene rentabilidad.'
    ]],
    ['trabajo_equipo', 'Trabajo en equipo', [
      'Coordina con cajero.', 'Coordina con mozos.', 'Coordina con cocina.', 'Coordina con despacho.',
      'Ayuda a compañeros.', 'Mantiene buena comunicación.', 'Acepta correcciones.',
      'Tiene actitud positiva.', 'Colabora en horas punta.', 'Mantiene respeto y profesionalismo.'
    ]],
    ['responsabilidad', 'Responsabilidad', [
      'Llega puntual.', 'Cumple horarios.', 'Sigue procedimientos.', 'Cuida equipos.',
      'Cuida licuadoras y utensilios.', 'Tiene iniciativa.', 'Reporta problemas.', 'Cumple metas.',
      'Mantiene disciplina.', 'Es confiable.'
    ]],
    ['kpi', 'KPI del encargado de líquidos', [
      'Jugos preparados por hora.', 'Tiempo promedio por bebida.', 'Pedidos entregados a tiempo.',
      'Tiempo de espera del cliente.', 'Reclamos por sabor.', 'Reclamos por presentación.',
      'Errores de preparación.', 'Cumplimiento de recetas.', 'Merma de fruta.', 'Consumo de azúcar.',
      'Consumo de leche.', 'Desperdicio total de insumos.', 'Veces que faltaron insumos.',
      'Limpieza de estación.', 'Estado de equipos.', 'Cumplimiento de procedimientos.'
    ]]
  ]),

  armado_master: buildMatriz('armado_master', 'Master / Armado final (fuente total)', [
    ['lectura_validacion', 'Lectura y validación de pedidos', [
      'Lee comandas correctamente.', 'Interpreta pedidos especiales.', 'Verifica modificaciones solicitadas.',
      'Verifica cantidad de productos.', 'Verifica bebidas.', 'Verifica adicionales.', 'Verifica promociones.',
      'Detecta errores de producción.', 'Detecta pedidos incompletos.', 'Autoriza la salida del pedido.'
    ]],
    ['armado_bandeja', 'Armado de bandeja o fuente', [
      'Organiza correctamente la presentación.', 'Ubica productos adecuadamente.', 'Mantiene orden visual.',
      'Cuida la estética del pedido.', 'Verifica limpieza de platos y fuentes.', 'Verifica envases de delivery.',
      'Verifica tapas y empaques.', 'Verifica cubiertos y servilletas.', 'Verifica salsas.',
      'Verifica acompañamientos.'
    ]],
    ['control_calidad', 'Control de calidad', [
      'Revisa presentación del sánguche.', 'Revisa calidad del pan.', 'Revisa calidad del chicharrón.',
      'Revisa calidad de la zarza.', 'Revisa calidad del camote.', 'Revisa calidad de bebidas.',
      'Detecta productos defectuosos.', 'Rechaza productos fuera de estándar.', 'Exige corrección inmediata.',
      'Mantiene estándares BELÚ.'
    ]],
    ['precision', 'Precisión', [
      'No envía pedidos equivocados.', 'No omite productos.', 'No omite bebidas.', 'No omite adicionales.',
      'No confunde mesas.', 'No confunde deliverys.', 'Verifica antes de entregar.', 'Mantiene exactitud.',
      'Reduce reclamos.', 'Reduce devoluciones.'
    ]],
    ['velocidad_operativa', 'Velocidad operativa', [
      'Arma pedidos rápidamente.', 'Mantiene flujo constante.', 'No genera cuellos de botella.',
      'Prioriza correctamente.', 'Maneja horas punta.', 'Mantiene ritmo constante.',
      'Coordina entregas rápidas.', 'Resuelve problemas operativos.', 'Anticipa congestiones.',
      'Mantiene continuidad operativa.'
    ]],
    ['coordinacion_general', 'Coordinación general', [
      'Coordina con plancha.', 'Coordina con cantor.', 'Coordina con líquidos.', 'Coordina con cocina.',
      'Coordina con mozos.', 'Coordina con caja.', 'Coordina con delivery.', 'Mantiene comunicación clara.',
      'Gestiona prioridades.', 'Mantiene control de la operación.'
    ]],
    ['liderazgo', 'Liderazgo', [
      'Corrige errores inmediatamente.', 'Da instrucciones claras.', 'Mantiene disciplina operativa.',
      'Exige estándares.', 'Motiva al equipo.', 'Resuelve conflictos.', 'Toma decisiones rápidas.',
      'Mantiene la calma bajo presión.', 'Tiene autoridad operativa.', 'Es ejemplo para el equipo.'
    ]],
    ['organizacion_limpieza', 'Organización y limpieza', [
      'Mantiene estación ordenada.', 'Mantiene área limpia.', 'Mantiene utensilios organizados.',
      'Mantiene comandas organizadas.', 'Evita acumulaciones.', 'Sigue procedimientos.',
      'Mantiene orden visual.', 'Mantiene estándares de higiene.', 'Aprovecha tiempos muertos.',
      'Promueve limpieza constante.'
    ]],
    ['responsabilidad', 'Responsabilidad', [
      'Llega puntual.', 'Cumple horarios.', 'Cuida equipos.', 'Cuida productos.', 'Cuida imagen de BELÚ.',
      'Tiene iniciativa.', 'Reporta problemas.', 'Cumple metas.', 'Es confiable.', 'Actúa como dueño del pedido.'
    ]],
    ['kpi', 'KPI del master', [
      'Pedidos devueltos.', 'Pedidos observados por clientes.', 'Reclamos por errores.',
      'Reclamos por faltantes.', 'Reclamos por presentación.', 'Pedidos completos entregados.',
      'Errores detectados antes de salir.', 'Errores que llegaron al cliente.',
      'Porcentaje de pedidos perfectos.', 'Tiempo de armado final.', 'Tiempo de despacho.',
      'Tiempo de liberación de pedido.', 'Flujo en horas punta.', 'Evaluación del equipo.',
      'Coordinación entre áreas.', 'Solución de problemas.', 'Cumplimiento de estándares.'
    ]]
  ])
};

const CARGO_MATRIZ = {
  'Mozo/Azafata': 'mozo',
  'Part time/salon': 'mozo',
  'Caja': 'cajero',
  'Planchero': 'planchero',
  'Cantor': 'cantor',
  'Ayudante de cocina': 'ayudante_cocina',
  'Part time/cocina': 'ayudante_cocina',
  'Líquidos': 'liquidos',
  'Armado': 'armado_master'
};

const UMBRALES = [30, 50, 70, 90, 100];

const out = `/* eslint-disable max-len */
'use strict';
// Auto-generado por scripts/build-evolucion-catalog.js — no editar a mano

const MATRICES = ${JSON.stringify(RAW, null, 2)};

const CARGO_MATRIZ = ${JSON.stringify(CARGO_MATRIZ, null, 2)};

const UMBRALES = ${JSON.stringify(UMBRALES)};

function matrizPorCargo(cargo) {
  const id = CARGO_MATRIZ[cargo];
  return id ? MATRICES[id] : null;
}

function matrizPorId(id) {
  return MATRICES[id] || null;
}

function allItemKeys(matrizId) {
  const m = MATRICES[matrizId];
  if (!m) return [];
  return m.categorias.flatMap(c => c.items.map(i => i.key));
}

function isValidItemKey(matrizId, itemKey) {
  return allItemKeys(matrizId).includes(itemKey);
}

function calcularProgreso(matrizId, completadosSet) {
  const keys = allItemKeys(matrizId);
  if (!keys.length) return { total: 0, completados: 0, porcentaje: 0 };
  const completados = keys.filter(k => completadosSet.has(k)).length;
  const porcentaje = Math.round((completados / keys.length) * 100);
  return { total: keys.length, completados, porcentaje };
}

function evaluarUmbrales(porcentajeAnterior, porcentajeNuevo, umbralesRegistrados) {
  const nuevos = [];
  for (const u of UMBRALES) {
    if (porcentajeNuevo >= u && porcentajeAnterior < u && !umbralesRegistrados.has(u)) {
      nuevos.push(u);
    }
  }
  return nuevos;
}

module.exports = {
  MATRICES,
  CARGO_MATRIZ,
  UMBRALES,
  matrizPorCargo,
  matrizPorId,
  allItemKeys,
  isValidItemKey,
  calcularProgreso,
  evaluarUmbrales
};
`;

const dest = path.join(__dirname, '..', 'lib', 'evolucionCatalogo.js');
fs.writeFileSync(dest, out, 'utf8');
console.log('Generado:', dest);
Object.entries(RAW).forEach(([k, v]) => console.log(`  ${k}: ${v.totalItems} ítems`));
