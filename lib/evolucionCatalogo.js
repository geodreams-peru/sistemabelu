/* eslint-disable max-len */
'use strict';
// Auto-generado por scripts/build-evolucion-catalog.js — no editar a mano

const MATRICES = {
  "mozo": {
    "id": "mozo",
    "titulo": "Mozo / Atención en salón",
    "categorias": [
      {
        "id": "conocimiento_negocio",
        "titulo": "Conocimiento del negocio",
        "items": [
          {
            "key": "mozo.conocimiento_negocio.conoce_toda_la_carta",
            "label": "Conoce toda la carta."
          },
          {
            "key": "mozo.conocimiento_negocio.conoce_los_ingredientes_de_cada_producto",
            "label": "Conoce los ingredientes de cada producto."
          },
          {
            "key": "mozo.conocimiento_negocio.conoce_promociones_vigentes",
            "label": "Conoce promociones vigentes."
          },
          {
            "key": "mozo.conocimiento_negocio.conoce_precios_sin_consultar",
            "label": "Conoce precios sin consultar."
          },
          {
            "key": "mozo.conocimiento_negocio.conoce_bebidas_y_acompanamientos",
            "label": "Conoce bebidas y acompañamientos."
          },
          {
            "key": "mozo.conocimiento_negocio.recomienda_productos_adecuadamente",
            "label": "Recomienda productos adecuadamente."
          },
          {
            "key": "mozo.conocimiento_negocio.responde_preguntas_de_clientes_con_seguridad",
            "label": "Responde preguntas de clientes con seguridad."
          },
          {
            "key": "mozo.conocimiento_negocio.conoce_protocolos_de_higiene",
            "label": "Conoce protocolos de higiene."
          }
        ]
      },
      {
        "id": "atencion_cliente",
        "titulo": "Atención al cliente",
        "items": [
          {
            "key": "mozo.atencion_cliente.saluda_inmediatamente_al_cliente",
            "label": "Saluda inmediatamente al cliente."
          },
          {
            "key": "mozo.atencion_cliente.sonrie_y_mantiene_buena_actitud",
            "label": "Sonríe y mantiene buena actitud."
          },
          {
            "key": "mozo.atencion_cliente.escucha_atentamente",
            "label": "Escucha atentamente."
          },
          {
            "key": "mozo.atencion_cliente.mantiene_contacto_visual",
            "label": "Mantiene contacto visual."
          },
          {
            "key": "mozo.atencion_cliente.resuelve_reclamos_sin_discutir",
            "label": "Resuelve reclamos sin discutir."
          },
          {
            "key": "mozo.atencion_cliente.hace_seguimiento_a_las_mesas",
            "label": "Hace seguimiento a las mesas."
          },
          {
            "key": "mozo.atencion_cliente.detecta_clientes_insatisfechos",
            "label": "Detecta clientes insatisfechos."
          },
          {
            "key": "mozo.atencion_cliente.se_despide_cordialmente",
            "label": "Se despide cordialmente."
          },
          {
            "key": "mozo.atencion_cliente.recuerda_clientes_frecuentes",
            "label": "Recuerda clientes frecuentes."
          },
          {
            "key": "mozo.atencion_cliente.genera_una_experiencia_agradable",
            "label": "Genera una experiencia agradable."
          }
        ]
      },
      {
        "id": "ventas",
        "titulo": "Ventas",
        "items": [
          {
            "key": "mozo.ventas.sugiere_bebidas",
            "label": "Sugiere bebidas."
          },
          {
            "key": "mozo.ventas.sugiere_postres",
            "label": "Sugiere postres."
          },
          {
            "key": "mozo.ventas.sugiere_adicionales",
            "label": "Sugiere adicionales."
          },
          {
            "key": "mozo.ventas.incrementa_el_ticket_promedio",
            "label": "Incrementa el ticket promedio."
          },
          {
            "key": "mozo.ventas.logra_ventas_complementarias",
            "label": "Logra ventas complementarias."
          },
          {
            "key": "mozo.ventas.convence_sin_presionar",
            "label": "Convence sin presionar."
          },
          {
            "key": "mozo.ventas.promueve_promociones",
            "label": "Promueve promociones."
          },
          {
            "key": "mozo.ventas.genera_repeticion_de_compra",
            "label": "Genera repetición de compra."
          },
          {
            "key": "mozo.ventas.obtiene_comentarios_positivos",
            "label": "Obtiene comentarios positivos."
          },
          {
            "key": "mozo.ventas.fideliza_clientes",
            "label": "Fideliza clientes."
          }
        ]
      },
      {
        "id": "velocidad",
        "titulo": "Velocidad",
        "items": [
          {
            "key": "mozo.velocidad.atiende_rapidamente",
            "label": "Atiende rápidamente."
          },
          {
            "key": "mozo.velocidad.toma_pedidos_sin_errores",
            "label": "Toma pedidos sin errores."
          },
          {
            "key": "mozo.velocidad.entrega_pedidos_completos",
            "label": "Entrega pedidos completos."
          },
          {
            "key": "mozo.velocidad.lleva_pedidos_a_tiempo",
            "label": "Lleva pedidos a tiempo."
          },
          {
            "key": "mozo.velocidad.cobra_rapidamente",
            "label": "Cobra rápidamente."
          },
          {
            "key": "mozo.velocidad.mantiene_mesas_atendidas",
            "label": "Mantiene mesas atendidas."
          },
          {
            "key": "mozo.velocidad.reduce_tiempos_de_espera",
            "label": "Reduce tiempos de espera."
          },
          {
            "key": "mozo.velocidad.atiende_varias_mesas_simultaneamente",
            "label": "Atiende varias mesas simultáneamente."
          }
        ]
      },
      {
        "id": "organizacion",
        "titulo": "Organización",
        "items": [
          {
            "key": "mozo.organizacion.mantiene_limpia_su_zona",
            "label": "Mantiene limpia su zona."
          },
          {
            "key": "mozo.organizacion.mantiene_mesas_limpias",
            "label": "Mantiene mesas limpias."
          },
          {
            "key": "mozo.organizacion.mantiene_utensilios_ordenados",
            "label": "Mantiene utensilios ordenados."
          },
          {
            "key": "mozo.organizacion.mantiene_abastecida_su_estacion",
            "label": "Mantiene abastecida su estación."
          },
          {
            "key": "mozo.organizacion.cumple_procedimientos",
            "label": "Cumple procedimientos."
          },
          {
            "key": "mozo.organizacion.mantiene_uniforme_impecable",
            "label": "Mantiene uniforme impecable."
          }
        ]
      },
      {
        "id": "trabajo_equipo",
        "titulo": "Trabajo en equipo",
        "items": [
          {
            "key": "mozo.trabajo_equipo.ayuda_a_companeros",
            "label": "Ayuda a compañeros."
          },
          {
            "key": "mozo.trabajo_equipo.apoya_en_momentos_de_alta_demanda",
            "label": "Apoya en momentos de alta demanda."
          },
          {
            "key": "mozo.trabajo_equipo.mantiene_buena_comunicacion",
            "label": "Mantiene buena comunicación."
          },
          {
            "key": "mozo.trabajo_equipo.colabora_con_cocina",
            "label": "Colabora con cocina."
          },
          {
            "key": "mozo.trabajo_equipo.colabora_con_caja",
            "label": "Colabora con caja."
          },
          {
            "key": "mozo.trabajo_equipo.acepta_correcciones",
            "label": "Acepta correcciones."
          },
          {
            "key": "mozo.trabajo_equipo.propone_mejoras",
            "label": "Propone mejoras."
          },
          {
            "key": "mozo.trabajo_equipo.mantiene_actitud_positiva",
            "label": "Mantiene actitud positiva."
          }
        ]
      },
      {
        "id": "responsabilidad",
        "titulo": "Responsabilidad",
        "items": [
          {
            "key": "mozo.responsabilidad.llega_puntual",
            "label": "Llega puntual."
          },
          {
            "key": "mozo.responsabilidad.cumple_horarios",
            "label": "Cumple horarios."
          },
          {
            "key": "mozo.responsabilidad.cuida_equipos",
            "label": "Cuida equipos."
          },
          {
            "key": "mozo.responsabilidad.cuida_productos",
            "label": "Cuida productos."
          },
          {
            "key": "mozo.responsabilidad.no_genera_desperdicios",
            "label": "No genera desperdicios."
          },
          {
            "key": "mozo.responsabilidad.cumple_indicaciones",
            "label": "Cumple indicaciones."
          },
          {
            "key": "mozo.responsabilidad.tiene_iniciativa",
            "label": "Tiene iniciativa."
          },
          {
            "key": "mozo.responsabilidad.es_confiable",
            "label": "Es confiable."
          }
        ]
      },
      {
        "id": "kpi",
        "titulo": "Indicadores de desempeño (KPI)",
        "items": [
          {
            "key": "mozo.kpi.ventas_promedio_por_cliente",
            "label": "Ventas promedio por cliente."
          },
          {
            "key": "mozo.kpi.ticket_promedio",
            "label": "Ticket promedio."
          },
          {
            "key": "mozo.kpi.clientes_atendidos_por_turno",
            "label": "Clientes atendidos por turno."
          },
          {
            "key": "mozo.kpi.quejas_recibidas",
            "label": "Quejas recibidas."
          },
          {
            "key": "mozo.kpi.comentarios_positivos",
            "label": "Comentarios positivos."
          },
          {
            "key": "mozo.kpi.clientes_que_regresan",
            "label": "Clientes que regresan."
          },
          {
            "key": "mozo.kpi.tiempo_promedio_de_atencion",
            "label": "Tiempo promedio de atención."
          },
          {
            "key": "mozo.kpi.errores_en_pedidos",
            "label": "Errores en pedidos."
          },
          {
            "key": "mozo.kpi.ventas_de_adicionales",
            "label": "Ventas de adicionales."
          },
          {
            "key": "mozo.kpi.cumplimiento_de_metas",
            "label": "Cumplimiento de metas."
          }
        ]
      }
    ],
    "totalItems": 68
  },
  "cajero": {
    "id": "cajero",
    "titulo": "Cajero – Matriz de habilidades",
    "categorias": [
      {
        "id": "conocimiento_negocio",
        "titulo": "Conocimiento del negocio",
        "items": [
          {
            "key": "cajero.conocimiento_negocio.conoce_toda_la_carta",
            "label": "Conoce toda la carta."
          },
          {
            "key": "cajero.conocimiento_negocio.conoce_todos_los_precios",
            "label": "Conoce todos los precios."
          },
          {
            "key": "cajero.conocimiento_negocio.conoce_promociones_vigentes",
            "label": "Conoce promociones vigentes."
          },
          {
            "key": "cajero.conocimiento_negocio.conoce_combos_y_paquetes",
            "label": "Conoce combos y paquetes."
          },
          {
            "key": "cajero.conocimiento_negocio.conoce_los_ingredientes_de_cada_producto",
            "label": "Conoce los ingredientes de cada producto."
          },
          {
            "key": "cajero.conocimiento_negocio.conoce_los_tiempos_de_preparacion",
            "label": "Conoce los tiempos de preparación."
          },
          {
            "key": "cajero.conocimiento_negocio.conoce_politicas_de_cambios_y_devoluciones",
            "label": "Conoce políticas de cambios y devoluciones."
          },
          {
            "key": "cajero.conocimiento_negocio.conoce_protocolos_de_atencion",
            "label": "Conoce protocolos de atención."
          },
          {
            "key": "cajero.conocimiento_negocio.conoce_metodos_de_pago",
            "label": "Conoce métodos de pago."
          },
          {
            "key": "cajero.conocimiento_negocio.conoce_procedimientos_de_apertura_y_cierre",
            "label": "Conoce procedimientos de apertura y cierre."
          }
        ]
      },
      {
        "id": "manejo_caja",
        "titulo": "Manejo de caja",
        "items": [
          {
            "key": "cajero.manejo_caja.realiza_aperturas_de_caja_correctamente",
            "label": "Realiza aperturas de caja correctamente."
          },
          {
            "key": "cajero.manejo_caja.realiza_cierres_sin_diferencias",
            "label": "Realiza cierres sin diferencias."
          },
          {
            "key": "cajero.manejo_caja.maneja_efectivo_correctamente",
            "label": "Maneja efectivo correctamente."
          },
          {
            "key": "cajero.manejo_caja.maneja_pos_correctamente",
            "label": "Maneja POS correctamente."
          },
          {
            "key": "cajero.manejo_caja.maneja_yape_y_plin_correctamente",
            "label": "Maneja Yape y Plin correctamente."
          },
          {
            "key": "cajero.manejo_caja.entrega_vuelto_exacto",
            "label": "Entrega vuelto exacto."
          },
          {
            "key": "cajero.manejo_caja.detecta_billetes_falsos",
            "label": "Detecta billetes falsos."
          },
          {
            "key": "cajero.manejo_caja.registra_todas_las_ventas",
            "label": "Registra todas las ventas."
          },
          {
            "key": "cajero.manejo_caja.evita_perdidas_de_dinero",
            "label": "Evita pérdidas de dinero."
          },
          {
            "key": "cajero.manejo_caja.mantiene_orden_documental",
            "label": "Mantiene orden documental."
          }
        ]
      },
      {
        "id": "atencion_cliente",
        "titulo": "Atención al cliente",
        "items": [
          {
            "key": "cajero.atencion_cliente.saluda_cordialmente",
            "label": "Saluda cordialmente."
          },
          {
            "key": "cajero.atencion_cliente.sonrie_al_atender",
            "label": "Sonríe al atender."
          },
          {
            "key": "cajero.atencion_cliente.mantiene_paciencia",
            "label": "Mantiene paciencia."
          },
          {
            "key": "cajero.atencion_cliente.escucha_al_cliente",
            "label": "Escucha al cliente."
          },
          {
            "key": "cajero.atencion_cliente.resuelve_dudas_rapidamente",
            "label": "Resuelve dudas rápidamente."
          },
          {
            "key": "cajero.atencion_cliente.resuelve_reclamos_adecuadamente",
            "label": "Resuelve reclamos adecuadamente."
          },
          {
            "key": "cajero.atencion_cliente.mantiene_buena_presentacion",
            "label": "Mantiene buena presentación."
          },
          {
            "key": "cajero.atencion_cliente.se_despide_cordialmente",
            "label": "Se despide cordialmente."
          },
          {
            "key": "cajero.atencion_cliente.atiende_con_rapidez",
            "label": "Atiende con rapidez."
          },
          {
            "key": "cajero.atencion_cliente.mantiene_actitud_positiva",
            "label": "Mantiene actitud positiva."
          }
        ]
      },
      {
        "id": "ventas",
        "titulo": "Ventas",
        "items": [
          {
            "key": "cajero.ventas.sugiere_bebidas",
            "label": "Sugiere bebidas."
          },
          {
            "key": "cajero.ventas.sugiere_postres",
            "label": "Sugiere postres."
          },
          {
            "key": "cajero.ventas.sugiere_extras",
            "label": "Sugiere extras."
          },
          {
            "key": "cajero.ventas.sugiere_productos_premium",
            "label": "Sugiere productos premium."
          },
          {
            "key": "cajero.ventas.promueve_promociones",
            "label": "Promueve promociones."
          },
          {
            "key": "cajero.ventas.incrementa_ticket_promedio",
            "label": "Incrementa ticket promedio."
          },
          {
            "key": "cajero.ventas.identifica_oportunidades_de_venta",
            "label": "Identifica oportunidades de venta."
          },
          {
            "key": "cajero.ventas.convence_sin_insistir_demasiado",
            "label": "Convence sin insistir demasiado."
          },
          {
            "key": "cajero.ventas.fideliza_clientes",
            "label": "Fideliza clientes."
          },
          {
            "key": "cajero.ventas.genera_recompra",
            "label": "Genera recompra."
          }
        ]
      },
      {
        "id": "precision_control",
        "titulo": "Precisión y control",
        "items": [
          {
            "key": "cajero.precision_control.ingresa_pedidos_sin_errores",
            "label": "Ingresa pedidos sin errores."
          },
          {
            "key": "cajero.precision_control.registra_productos_correctamente",
            "label": "Registra productos correctamente."
          },
          {
            "key": "cajero.precision_control.evita_anulaciones_innecesarias",
            "label": "Evita anulaciones innecesarias."
          },
          {
            "key": "cajero.precision_control.verifica_montos_antes_de_cobrar",
            "label": "Verifica montos antes de cobrar."
          },
          {
            "key": "cajero.precision_control.verifica_cambios_de_precios",
            "label": "Verifica cambios de precios."
          },
          {
            "key": "cajero.precision_control.revisa_comprobantes_emitidos",
            "label": "Revisa comprobantes emitidos."
          },
          {
            "key": "cajero.precision_control.mantiene_control_de_pedidos_pendientes",
            "label": "Mantiene control de pedidos pendientes."
          },
          {
            "key": "cajero.precision_control.minimiza_errores_operativos",
            "label": "Minimiza errores operativos."
          },
          {
            "key": "cajero.precision_control.cumple_procedimientos",
            "label": "Cumple procedimientos."
          },
          {
            "key": "cajero.precision_control.cuida_informacion_sensible",
            "label": "Cuida información sensible."
          }
        ]
      },
      {
        "id": "velocidad",
        "titulo": "Velocidad",
        "items": [
          {
            "key": "cajero.velocidad.atiende_rapidamente",
            "label": "Atiende rápidamente."
          },
          {
            "key": "cajero.velocidad.cobra_rapidamente",
            "label": "Cobra rápidamente."
          },
          {
            "key": "cajero.velocidad.emite_comprobantes_rapidamente",
            "label": "Emite comprobantes rápidamente."
          },
          {
            "key": "cajero.velocidad.atiende_horas_punta_eficientemente",
            "label": "Atiende horas punta eficientemente."
          },
          {
            "key": "cajero.velocidad.gestiona_colas_adecuadamente",
            "label": "Gestiona colas adecuadamente."
          },
          {
            "key": "cajero.velocidad.prioriza_tareas_correctamente",
            "label": "Prioriza tareas correctamente."
          },
          {
            "key": "cajero.velocidad.responde_consultas_rapidamente",
            "label": "Responde consultas rápidamente."
          },
          {
            "key": "cajero.velocidad.mantiene_fluidez_en_atencion",
            "label": "Mantiene fluidez en atención."
          }
        ]
      },
      {
        "id": "organizacion",
        "titulo": "Organización",
        "items": [
          {
            "key": "cajero.organizacion.mantiene_area_limpia",
            "label": "Mantiene área limpia."
          },
          {
            "key": "cajero.organizacion.mantiene_documentos_ordenados",
            "label": "Mantiene documentos ordenados."
          },
          {
            "key": "cajero.organizacion.mantiene_caja_organizada",
            "label": "Mantiene caja organizada."
          },
          {
            "key": "cajero.organizacion.mantiene_insumos_de_trabajo_disponibles",
            "label": "Mantiene insumos de trabajo disponibles."
          },
          {
            "key": "cajero.organizacion.reporta_faltantes",
            "label": "Reporta faltantes."
          },
          {
            "key": "cajero.organizacion.mantiene_escritorio_ordenado",
            "label": "Mantiene escritorio ordenado."
          },
          {
            "key": "cajero.organizacion.cumple_checklists_diarios",
            "label": "Cumple checklists diarios."
          }
        ]
      },
      {
        "id": "trabajo_equipo",
        "titulo": "Trabajo en equipo",
        "items": [
          {
            "key": "cajero.trabajo_equipo.ayuda_a_los_mozos",
            "label": "Ayuda a los mozos."
          },
          {
            "key": "cajero.trabajo_equipo.coordina_bien_con_cocina",
            "label": "Coordina bien con cocina."
          },
          {
            "key": "cajero.trabajo_equipo.coordina_bien_con_delivery",
            "label": "Coordina bien con delivery."
          },
          {
            "key": "cajero.trabajo_equipo.coordina_bien_con_administracion",
            "label": "Coordina bien con administración."
          },
          {
            "key": "cajero.trabajo_equipo.mantiene_buena_comunicacion",
            "label": "Mantiene buena comunicación."
          },
          {
            "key": "cajero.trabajo_equipo.apoya_en_momentos_de_alta_demanda",
            "label": "Apoya en momentos de alta demanda."
          },
          {
            "key": "cajero.trabajo_equipo.acepta_correcciones",
            "label": "Acepta correcciones."
          },
          {
            "key": "cajero.trabajo_equipo.propone_mejoras",
            "label": "Propone mejoras."
          }
        ]
      },
      {
        "id": "responsabilidad",
        "titulo": "Responsabilidad",
        "items": [
          {
            "key": "cajero.responsabilidad.llega_puntual",
            "label": "Llega puntual."
          },
          {
            "key": "cajero.responsabilidad.cumple_horarios",
            "label": "Cumple horarios."
          },
          {
            "key": "cajero.responsabilidad.cumple_procedimientos",
            "label": "Cumple procedimientos."
          },
          {
            "key": "cajero.responsabilidad.cuida_equipos",
            "label": "Cuida equipos."
          },
          {
            "key": "cajero.responsabilidad.cuida_informacion_de_ventas",
            "label": "Cuida información de ventas."
          },
          {
            "key": "cajero.responsabilidad.mantiene_confidencialidad",
            "label": "Mantiene confidencialidad."
          },
          {
            "key": "cajero.responsabilidad.demuestra_honestidad",
            "label": "Demuestra honestidad."
          }
        ]
      },
      {
        "id": "kpi",
        "titulo": "Indicadores (KPI)",
        "items": [
          {
            "key": "cajero.kpi.diferencia_de_caja_s",
            "label": "Diferencia de caja (S/)."
          },
          {
            "key": "cajero.kpi.errores_de_cobro",
            "label": "Errores de cobro."
          },
          {
            "key": "cajero.kpi.errores_de_digitacion",
            "label": "Errores de digitación."
          },
          {
            "key": "cajero.kpi.tiempo_promedio_de_atencion",
            "label": "Tiempo promedio de atención."
          },
          {
            "key": "cajero.kpi.numero_de_anulaciones",
            "label": "Número de anulaciones."
          },
          {
            "key": "cajero.kpi.ticket_promedio",
            "label": "Ticket promedio."
          },
          {
            "key": "cajero.kpi.venta_de_adicionales",
            "label": "Venta de adicionales."
          },
          {
            "key": "cajero.kpi.venta_de_bebidas",
            "label": "Venta de bebidas."
          },
          {
            "key": "cajero.kpi.venta_de_postres",
            "label": "Venta de postres."
          },
          {
            "key": "cajero.kpi.cumplimiento_de_metas",
            "label": "Cumplimiento de metas."
          },
          {
            "key": "cajero.kpi.reclamos_recibidos",
            "label": "Reclamos recibidos."
          },
          {
            "key": "cajero.kpi.comentarios_positivos",
            "label": "Comentarios positivos."
          },
          {
            "key": "cajero.kpi.clientes_recurrentes",
            "label": "Clientes recurrentes."
          },
          {
            "key": "cajero.kpi.tiempo_de_respuesta",
            "label": "Tiempo de respuesta."
          },
          {
            "key": "cajero.kpi.exactitud_en_cierres_de_caja",
            "label": "Exactitud en cierres de caja."
          },
          {
            "key": "cajero.kpi.exactitud_en_emision_de_comprobantes",
            "label": "Exactitud en emisión de comprobantes."
          },
          {
            "key": "cajero.kpi.cumplimiento_de_procedimientos",
            "label": "Cumplimiento de procedimientos."
          }
        ]
      }
    ],
    "totalItems": 97
  },
  "planchero": {
    "id": "planchero",
    "titulo": "Planchero (Armado y salida de sánguches)",
    "categorias": [
      {
        "id": "conocimiento_producto",
        "titulo": "Conocimiento del producto",
        "items": [
          {
            "key": "planchero.conocimiento_producto.conoce_toda_la_carta",
            "label": "Conoce toda la carta."
          },
          {
            "key": "planchero.conocimiento_producto.conoce_las_recetas_exactas",
            "label": "Conoce las recetas exactas."
          },
          {
            "key": "planchero.conocimiento_producto.conoce_las_porciones_correctas",
            "label": "Conoce las porciones correctas."
          },
          {
            "key": "planchero.conocimiento_producto.conoce_los_estandares_de_belu",
            "label": "Conoce los estándares de BELÚ."
          },
          {
            "key": "planchero.conocimiento_producto.identifica_cada_tipo_de_sandwich_rapidamente",
            "label": "Identifica cada tipo de sándwich rápidamente."
          },
          {
            "key": "planchero.conocimiento_producto.conoce_los_acompanamientos_de_cada_producto",
            "label": "Conoce los acompañamientos de cada producto."
          },
          {
            "key": "planchero.conocimiento_producto.conoce_las_promociones_vigentes",
            "label": "Conoce las promociones vigentes."
          },
          {
            "key": "planchero.conocimiento_producto.conoce_los_procedimientos_de_produccion",
            "label": "Conoce los procedimientos de producción."
          },
          {
            "key": "planchero.conocimiento_producto.conoce_los_tiempos_de_preparacion",
            "label": "Conoce los tiempos de preparación."
          },
          {
            "key": "planchero.conocimiento_producto.identifica_errores_antes_de_despachar",
            "label": "Identifica errores antes de despachar."
          }
        ]
      },
      {
        "id": "calidad_producto",
        "titulo": "Calidad del producto",
        "items": [
          {
            "key": "planchero.calidad_producto.mantiene_el_mismo_sabor_siempre",
            "label": "Mantiene el mismo sabor siempre."
          },
          {
            "key": "planchero.calidad_producto.respeta_gramajes",
            "label": "Respeta gramajes."
          },
          {
            "key": "planchero.calidad_producto.respeta_recetas",
            "label": "Respeta recetas."
          },
          {
            "key": "planchero.calidad_producto.mantiene_buena_presentacion",
            "label": "Mantiene buena presentación."
          },
          {
            "key": "planchero.calidad_producto.entrega_productos_completos",
            "label": "Entrega productos completos."
          },
          {
            "key": "planchero.calidad_producto.verifica_calidad_del_pan",
            "label": "Verifica calidad del pan."
          },
          {
            "key": "planchero.calidad_producto.verifica_calidad_del_chicharron",
            "label": "Verifica calidad del chicharrón."
          },
          {
            "key": "planchero.calidad_producto.verifica_calidad_de_la_zarza",
            "label": "Verifica calidad de la zarza."
          },
          {
            "key": "planchero.calidad_producto.verifica_calidad_de_salsas",
            "label": "Verifica calidad de salsas."
          },
          {
            "key": "planchero.calidad_producto.corrige_productos_defectuosos",
            "label": "Corrige productos defectuosos."
          }
        ]
      },
      {
        "id": "velocidad_produccion",
        "titulo": "Velocidad de producción",
        "items": [
          {
            "key": "planchero.velocidad_produccion.arma_sandwiches_rapidamente",
            "label": "Arma sándwiches rápidamente."
          },
          {
            "key": "planchero.velocidad_produccion.mantiene_ritmo_constante",
            "label": "Mantiene ritmo constante."
          },
          {
            "key": "planchero.velocidad_produccion.trabaja_bien_bajo_presion",
            "label": "Trabaja bien bajo presión."
          },
          {
            "key": "planchero.velocidad_produccion.reduce_tiempos_muertos",
            "label": "Reduce tiempos muertos."
          },
          {
            "key": "planchero.velocidad_produccion.prioriza_pedidos_correctamente",
            "label": "Prioriza pedidos correctamente."
          },
          {
            "key": "planchero.velocidad_produccion.cumple_tiempos_objetivo",
            "label": "Cumple tiempos objetivo."
          },
          {
            "key": "planchero.velocidad_produccion.mantiene_fluidez_en_horas_punta",
            "label": "Mantiene fluidez en horas punta."
          },
          {
            "key": "planchero.velocidad_produccion.atiende_multiples_pedidos_simultaneamente",
            "label": "Atiende múltiples pedidos simultáneamente."
          },
          {
            "key": "planchero.velocidad_produccion.evita_cuellos_de_botella",
            "label": "Evita cuellos de botella."
          },
          {
            "key": "planchero.velocidad_produccion.mantiene_productividad_durante_todo_el_turno",
            "label": "Mantiene productividad durante todo el turno."
          }
        ]
      },
      {
        "id": "precision",
        "titulo": "Precisión",
        "items": [
          {
            "key": "planchero.precision.no_confunde_pedidos",
            "label": "No confunde pedidos."
          },
          {
            "key": "planchero.precision.no_omite_ingredientes",
            "label": "No omite ingredientes."
          },
          {
            "key": "planchero.precision.respeta_modificaciones_del_cliente",
            "label": "Respeta modificaciones del cliente."
          },
          {
            "key": "planchero.precision.lee_correctamente_comandas",
            "label": "Lee correctamente comandas."
          },
          {
            "key": "planchero.precision.verifica_pedidos_antes_de_entregar",
            "label": "Verifica pedidos antes de entregar."
          },
          {
            "key": "planchero.precision.minimiza_reprocesos",
            "label": "Minimiza reprocesos."
          },
          {
            "key": "planchero.precision.reduce_devoluciones",
            "label": "Reduce devoluciones."
          },
          {
            "key": "planchero.precision.reduce_errores_operativos",
            "label": "Reduce errores operativos."
          },
          {
            "key": "planchero.precision.entrega_pedidos_exactos",
            "label": "Entrega pedidos exactos."
          },
          {
            "key": "planchero.precision.cumple_estandares_sin_supervision",
            "label": "Cumple estándares sin supervisión."
          }
        ]
      },
      {
        "id": "organizacion_estacion",
        "titulo": "Organización de estación",
        "items": [
          {
            "key": "planchero.organizacion_estacion.mantiene_la_mesa_ordenada",
            "label": "Mantiene la mesa ordenada."
          },
          {
            "key": "planchero.organizacion_estacion.mantiene_ingredientes_organizados",
            "label": "Mantiene ingredientes organizados."
          },
          {
            "key": "planchero.organizacion_estacion.mantiene_utensilios_en_su_lugar",
            "label": "Mantiene utensilios en su lugar."
          },
          {
            "key": "planchero.organizacion_estacion.repone_productos_a_tiempo",
            "label": "Repone productos a tiempo."
          },
          {
            "key": "planchero.organizacion_estacion.mantiene_limpieza_constante",
            "label": "Mantiene limpieza constante."
          },
          {
            "key": "planchero.organizacion_estacion.identifica_faltantes_rapidamente",
            "label": "Identifica faltantes rápidamente."
          },
          {
            "key": "planchero.organizacion_estacion.reporta_insumos_bajos",
            "label": "Reporta insumos bajos."
          },
          {
            "key": "planchero.organizacion_estacion.evita_acumulacion_de_desorden",
            "label": "Evita acumulación de desorden."
          },
          {
            "key": "planchero.organizacion_estacion.mantiene_flujo_eficiente_de_trabajo",
            "label": "Mantiene flujo eficiente de trabajo."
          },
          {
            "key": "planchero.organizacion_estacion.sigue_procedimientos_de_limpieza",
            "label": "Sigue procedimientos de limpieza."
          }
        ]
      },
      {
        "id": "control_desperdicios",
        "titulo": "Control de desperdicios",
        "items": [
          {
            "key": "planchero.control_desperdicios.evita_exceso_de_porciones",
            "label": "Evita exceso de porciones."
          },
          {
            "key": "planchero.control_desperdicios.reduce_desperdicio_de_pan",
            "label": "Reduce desperdicio de pan."
          },
          {
            "key": "planchero.control_desperdicios.reduce_desperdicio_de_chicharron",
            "label": "Reduce desperdicio de chicharrón."
          },
          {
            "key": "planchero.control_desperdicios.reduce_desperdicio_de_zarza",
            "label": "Reduce desperdicio de zarza."
          },
          {
            "key": "planchero.control_desperdicios.reduce_desperdicio_de_salsas",
            "label": "Reduce desperdicio de salsas."
          },
          {
            "key": "planchero.control_desperdicios.aprovecha_correctamente_los_insumos",
            "label": "Aprovecha correctamente los insumos."
          },
          {
            "key": "planchero.control_desperdicios.cuida_el_costo_de_produccion",
            "label": "Cuida el costo de producción."
          },
          {
            "key": "planchero.control_desperdicios.mantiene_control_de_mermas",
            "label": "Mantiene control de mermas."
          },
          {
            "key": "planchero.control_desperdicios.reporta_perdidas",
            "label": "Reporta pérdidas."
          },
          {
            "key": "planchero.control_desperdicios.trabaja_con_mentalidad_de_ahorro",
            "label": "Trabaja con mentalidad de ahorro."
          }
        ]
      },
      {
        "id": "higiene_inocuidad",
        "titulo": "Higiene e inocuidad",
        "items": [
          {
            "key": "planchero.higiene_inocuidad.mantiene_manos_limpias",
            "label": "Mantiene manos limpias."
          },
          {
            "key": "planchero.higiene_inocuidad.usa_uniforme_correctamente",
            "label": "Usa uniforme correctamente."
          },
          {
            "key": "planchero.higiene_inocuidad.mantiene_area_higienica",
            "label": "Mantiene área higiénica."
          },
          {
            "key": "planchero.higiene_inocuidad.evita_contaminacion_cruzada",
            "label": "Evita contaminación cruzada."
          },
          {
            "key": "planchero.higiene_inocuidad.manipula_alimentos_correctamente",
            "label": "Manipula alimentos correctamente."
          },
          {
            "key": "planchero.higiene_inocuidad.cumple_protocolos_sanitarios",
            "label": "Cumple protocolos sanitarios."
          },
          {
            "key": "planchero.higiene_inocuidad.mantiene_utensilios_limpios",
            "label": "Mantiene utensilios limpios."
          },
          {
            "key": "planchero.higiene_inocuidad.mantiene_superficies_limpias",
            "label": "Mantiene superficies limpias."
          },
          {
            "key": "planchero.higiene_inocuidad.cumple_controles_de_calidad",
            "label": "Cumple controles de calidad."
          },
          {
            "key": "planchero.higiene_inocuidad.respeta_normas_de_seguridad_alimentaria",
            "label": "Respeta normas de seguridad alimentaria."
          }
        ]
      },
      {
        "id": "trabajo_equipo",
        "titulo": "Trabajo en equipo",
        "items": [
          {
            "key": "planchero.trabajo_equipo.coordina_con_cocina",
            "label": "Coordina con cocina."
          },
          {
            "key": "planchero.trabajo_equipo.coordina_con_mozos",
            "label": "Coordina con mozos."
          },
          {
            "key": "planchero.trabajo_equipo.coordina_con_cajero",
            "label": "Coordina con cajero."
          },
          {
            "key": "planchero.trabajo_equipo.coordina_con_despacho",
            "label": "Coordina con despacho."
          },
          {
            "key": "planchero.trabajo_equipo.ayuda_a_companeros",
            "label": "Ayuda a compañeros."
          },
          {
            "key": "planchero.trabajo_equipo.mantiene_buena_comunicacion",
            "label": "Mantiene buena comunicación."
          },
          {
            "key": "planchero.trabajo_equipo.acepta_correcciones",
            "label": "Acepta correcciones."
          },
          {
            "key": "planchero.trabajo_equipo.capacita_a_nuevos_colaboradores",
            "label": "Capacita a nuevos colaboradores."
          },
          {
            "key": "planchero.trabajo_equipo.mantiene_actitud_positiva",
            "label": "Mantiene actitud positiva."
          },
          {
            "key": "planchero.trabajo_equipo.colabora_en_momentos_criticos",
            "label": "Colabora en momentos críticos."
          }
        ]
      },
      {
        "id": "responsabilidad",
        "titulo": "Responsabilidad",
        "items": [
          {
            "key": "planchero.responsabilidad.llega_puntual",
            "label": "Llega puntual."
          },
          {
            "key": "planchero.responsabilidad.cumple_horarios",
            "label": "Cumple horarios."
          },
          {
            "key": "planchero.responsabilidad.cuida_equipos",
            "label": "Cuida equipos."
          },
          {
            "key": "planchero.responsabilidad.cuida_planchas_y_herramientas",
            "label": "Cuida planchas y herramientas."
          },
          {
            "key": "planchero.responsabilidad.sigue_procedimientos",
            "label": "Sigue procedimientos."
          },
          {
            "key": "planchero.responsabilidad.mantiene_disciplina",
            "label": "Mantiene disciplina."
          },
          {
            "key": "planchero.responsabilidad.tiene_iniciativa",
            "label": "Tiene iniciativa."
          },
          {
            "key": "planchero.responsabilidad.cumple_metas_de_produccion",
            "label": "Cumple metas de producción."
          },
          {
            "key": "planchero.responsabilidad.mantiene_compromiso_con_la_calidad",
            "label": "Mantiene compromiso con la calidad."
          },
          {
            "key": "planchero.responsabilidad.es_confiable",
            "label": "Es confiable."
          }
        ]
      },
      {
        "id": "kpi",
        "titulo": "KPI (Indicadores del planchero)",
        "items": [
          {
            "key": "planchero.kpi.sandwiches_producidos_por_hora",
            "label": "Sándwiches producidos por hora."
          },
          {
            "key": "planchero.kpi.pedidos_terminados_por_turno",
            "label": "Pedidos terminados por turno."
          },
          {
            "key": "planchero.kpi.tiempo_promedio_por_pedido",
            "label": "Tiempo promedio por pedido."
          },
          {
            "key": "planchero.kpi.tiempo_en_hora_punta",
            "label": "Tiempo en hora punta."
          },
          {
            "key": "planchero.kpi.reclamos_por_producto",
            "label": "Reclamos por producto."
          },
          {
            "key": "planchero.kpi.devoluciones",
            "label": "Devoluciones."
          },
          {
            "key": "planchero.kpi.errores_de_armado",
            "label": "Errores de armado."
          },
          {
            "key": "planchero.kpi.cumplimiento_de_receta",
            "label": "Cumplimiento de receta."
          },
          {
            "key": "planchero.kpi.desperdicio_de_insumos",
            "label": "Desperdicio de insumos."
          },
          {
            "key": "planchero.kpi.merma_de_chicharron",
            "label": "Merma de chicharrón."
          },
          {
            "key": "planchero.kpi.merma_de_pan",
            "label": "Merma de pan."
          },
          {
            "key": "planchero.kpi.uso_correcto_de_porciones",
            "label": "Uso correcto de porciones."
          },
          {
            "key": "planchero.kpi.limpieza_de_estacion",
            "label": "Limpieza de estación."
          },
          {
            "key": "planchero.kpi.cumplimiento_de_procedimientos",
            "label": "Cumplimiento de procedimientos."
          },
          {
            "key": "planchero.kpi.puntualidad",
            "label": "Puntualidad."
          },
          {
            "key": "planchero.kpi.trabajo_en_equipo",
            "label": "Trabajo en equipo."
          }
        ]
      }
    ],
    "totalItems": 106
  },
  "cantor": {
    "id": "cantor",
    "titulo": "Cantor – Matriz de habilidades",
    "categorias": [
      {
        "id": "lectura_comandas",
        "titulo": "Lectura y control de comandas",
        "items": [
          {
            "key": "cantor.lectura_comandas.lee_comandas_rapidamente",
            "label": "Lee comandas rápidamente."
          },
          {
            "key": "cantor.lectura_comandas.interpreta_correctamente_los_pedidos",
            "label": "Interpreta correctamente los pedidos."
          },
          {
            "key": "cantor.lectura_comandas.identifica_modificaciones_especiales",
            "label": "Identifica modificaciones especiales."
          },
          {
            "key": "cantor.lectura_comandas.detecta_errores_en_pedidos",
            "label": "Detecta errores en pedidos."
          },
          {
            "key": "cantor.lectura_comandas.prioriza_pedidos_segun_orden",
            "label": "Prioriza pedidos según orden."
          },
          {
            "key": "cantor.lectura_comandas.evita_confusiones_entre_comandas",
            "label": "Evita confusiones entre comandas."
          },
          {
            "key": "cantor.lectura_comandas.mantiene_secuencia_correcta",
            "label": "Mantiene secuencia correcta."
          },
          {
            "key": "cantor.lectura_comandas.verifica_pedidos_antes_de_cantar",
            "label": "Verifica pedidos antes de cantar."
          },
          {
            "key": "cantor.lectura_comandas.coordina_con_caja_cuando_hay_dudas",
            "label": "Coordina con caja cuando hay dudas."
          },
          {
            "key": "cantor.lectura_comandas.reduce_errores_de_comunicacion",
            "label": "Reduce errores de comunicación."
          }
        ]
      },
      {
        "id": "comunicacion",
        "titulo": "Comunicación",
        "items": [
          {
            "key": "cantor.comunicacion.canta_pedidos_claramente",
            "label": "Canta pedidos claramente."
          },
          {
            "key": "cantor.comunicacion.tiene_buena_diccion",
            "label": "Tiene buena dicción."
          },
          {
            "key": "cantor.comunicacion.habla_fuerte_y_entendible",
            "label": "Habla fuerte y entendible."
          },
          {
            "key": "cantor.comunicacion.mantiene_calma_bajo_presion",
            "label": "Mantiene calma bajo presión."
          },
          {
            "key": "cantor.comunicacion.coordina_bien_con_plancha",
            "label": "Coordina bien con plancha."
          },
          {
            "key": "cantor.comunicacion.coordina_con_cocina",
            "label": "Coordina con cocina."
          },
          {
            "key": "cantor.comunicacion.coordina_con_despacho",
            "label": "Coordina con despacho."
          },
          {
            "key": "cantor.comunicacion.coordina_con_mozos",
            "label": "Coordina con mozos."
          },
          {
            "key": "cantor.comunicacion.transmite_cambios_correctamente",
            "label": "Transmite cambios correctamente."
          },
          {
            "key": "cantor.comunicacion.mantiene_comunicacion_constante",
            "label": "Mantiene comunicación constante."
          }
        ]
      },
      {
        "id": "abastecimiento_plancha",
        "titulo": "Abastecimiento de plancha",
        "items": [
          {
            "key": "cantor.abastecimiento_plancha.mantiene_pan_disponible",
            "label": "Mantiene pan disponible."
          },
          {
            "key": "cantor.abastecimiento_plancha.mantiene_chicharron_disponible",
            "label": "Mantiene chicharrón disponible."
          },
          {
            "key": "cantor.abastecimiento_plancha.mantiene_zarza_disponible",
            "label": "Mantiene zarza disponible."
          },
          {
            "key": "cantor.abastecimiento_plancha.mantiene_camote_disponible",
            "label": "Mantiene camote disponible."
          },
          {
            "key": "cantor.abastecimiento_plancha.mantiene_salsas_disponibles",
            "label": "Mantiene salsas disponibles."
          },
          {
            "key": "cantor.abastecimiento_plancha.anticipa_faltantes",
            "label": "Anticipa faltantes."
          },
          {
            "key": "cantor.abastecimiento_plancha.repone_antes_de_que_se_agoten",
            "label": "Repone antes de que se agoten."
          },
          {
            "key": "cantor.abastecimiento_plancha.mantiene_flujo_continuo",
            "label": "Mantiene flujo continuo."
          },
          {
            "key": "cantor.abastecimiento_plancha.evita_que_la_plancha_se_detenga",
            "label": "Evita que la plancha se detenga."
          },
          {
            "key": "cantor.abastecimiento_plancha.organiza_insumos_eficientemente",
            "label": "Organiza insumos eficientemente."
          }
        ]
      },
      {
        "id": "velocidad_operativa",
        "titulo": "Velocidad operativa",
        "items": [
          {
            "key": "cantor.velocidad_operativa.reacciona_rapido",
            "label": "Reacciona rápido."
          },
          {
            "key": "cantor.velocidad_operativa.mantiene_ritmo_constante",
            "label": "Mantiene ritmo constante."
          },
          {
            "key": "cantor.velocidad_operativa.atiende_varios_pedidos_simultaneamente",
            "label": "Atiende varios pedidos simultáneamente."
          },
          {
            "key": "cantor.velocidad_operativa.prioriza_correctamente",
            "label": "Prioriza correctamente."
          },
          {
            "key": "cantor.velocidad_operativa.reduce_tiempos_muertos",
            "label": "Reduce tiempos muertos."
          },
          {
            "key": "cantor.velocidad_operativa.mantiene_produccion_fluida",
            "label": "Mantiene producción fluida."
          },
          {
            "key": "cantor.velocidad_operativa.trabaja_bien_en_horas_punta",
            "label": "Trabaja bien en horas punta."
          },
          {
            "key": "cantor.velocidad_operativa.resuelve_cuellos_de_botella",
            "label": "Resuelve cuellos de botella."
          },
          {
            "key": "cantor.velocidad_operativa.anticipa_necesidades",
            "label": "Anticipa necesidades."
          },
          {
            "key": "cantor.velocidad_operativa.mantiene_continuidad_operativa",
            "label": "Mantiene continuidad operativa."
          }
        ]
      },
      {
        "id": "organizacion",
        "titulo": "Organización",
        "items": [
          {
            "key": "cantor.organizacion.mantiene_estacion_ordenada",
            "label": "Mantiene estación ordenada."
          },
          {
            "key": "cantor.organizacion.organiza_comandas",
            "label": "Organiza comandas."
          },
          {
            "key": "cantor.organizacion.organiza_insumos",
            "label": "Organiza insumos."
          },
          {
            "key": "cantor.organizacion.organiza_utensilios",
            "label": "Organiza utensilios."
          },
          {
            "key": "cantor.organizacion.mantiene_areas_despejadas",
            "label": "Mantiene áreas despejadas."
          },
          {
            "key": "cantor.organizacion.evita_acumulaciones",
            "label": "Evita acumulaciones."
          },
          {
            "key": "cantor.organizacion.mantiene_limpieza_constante",
            "label": "Mantiene limpieza constante."
          },
          {
            "key": "cantor.organizacion.identifica_desorden_rapidamente",
            "label": "Identifica desorden rápidamente."
          },
          {
            "key": "cantor.organizacion.sigue_procedimientos",
            "label": "Sigue procedimientos."
          },
          {
            "key": "cantor.organizacion.mantiene_disciplina_operativa",
            "label": "Mantiene disciplina operativa."
          }
        ]
      },
      {
        "id": "lavado_limpieza",
        "titulo": "Lavado y limpieza",
        "items": [
          {
            "key": "cantor.lavado_limpieza.aprovecha_tiempos_muertos",
            "label": "Aprovecha tiempos muertos."
          },
          {
            "key": "cantor.lavado_limpieza.lava_utensilios_oportunamente",
            "label": "Lava utensilios oportunamente."
          },
          {
            "key": "cantor.lavado_limpieza.lava_tablas_y_recipientes",
            "label": "Lava tablas y recipientes."
          },
          {
            "key": "cantor.lavado_limpieza.mantiene_limpieza_general",
            "label": "Mantiene limpieza general."
          },
          {
            "key": "cantor.lavado_limpieza.mantiene_areas_sanitizadas",
            "label": "Mantiene áreas sanitizadas."
          },
          {
            "key": "cantor.lavado_limpieza.evita_acumulacion_de_vajilla",
            "label": "Evita acumulación de vajilla."
          },
          {
            "key": "cantor.lavado_limpieza.cumple_protocolos_de_higiene",
            "label": "Cumple protocolos de higiene."
          },
          {
            "key": "cantor.lavado_limpieza.mantiene_implementos_limpios",
            "label": "Mantiene implementos limpios."
          },
          {
            "key": "cantor.lavado_limpieza.colabora_con_limpieza_general",
            "label": "Colabora con limpieza general."
          },
          {
            "key": "cantor.lavado_limpieza.mantiene_orden_permanente",
            "label": "Mantiene orden permanente."
          }
        ]
      },
      {
        "id": "trabajo_equipo",
        "titulo": "Trabajo en equipo",
        "items": [
          {
            "key": "cantor.trabajo_equipo.ayuda_al_planchero",
            "label": "Ayuda al planchero."
          },
          {
            "key": "cantor.trabajo_equipo.ayuda_a_cocina",
            "label": "Ayuda a cocina."
          },
          {
            "key": "cantor.trabajo_equipo.ayuda_a_despacho",
            "label": "Ayuda a despacho."
          },
          {
            "key": "cantor.trabajo_equipo.ayuda_a_mozos",
            "label": "Ayuda a mozos."
          },
          {
            "key": "cantor.trabajo_equipo.tiene_actitud_colaborativa",
            "label": "Tiene actitud colaborativa."
          },
          {
            "key": "cantor.trabajo_equipo.mantiene_respeto",
            "label": "Mantiene respeto."
          },
          {
            "key": "cantor.trabajo_equipo.acepta_correcciones",
            "label": "Acepta correcciones."
          },
          {
            "key": "cantor.trabajo_equipo.capacita_a_nuevos_colaboradores",
            "label": "Capacita a nuevos colaboradores."
          },
          {
            "key": "cantor.trabajo_equipo.mantiene_actitud_positiva",
            "label": "Mantiene actitud positiva."
          },
          {
            "key": "cantor.trabajo_equipo.colabora_en_emergencias",
            "label": "Colabora en emergencias."
          }
        ]
      },
      {
        "id": "responsabilidad",
        "titulo": "Responsabilidad",
        "items": [
          {
            "key": "cantor.responsabilidad.llega_puntual",
            "label": "Llega puntual."
          },
          {
            "key": "cantor.responsabilidad.cumple_horarios",
            "label": "Cumple horarios."
          },
          {
            "key": "cantor.responsabilidad.sigue_instrucciones",
            "label": "Sigue instrucciones."
          },
          {
            "key": "cantor.responsabilidad.cuida_equipos",
            "label": "Cuida equipos."
          },
          {
            "key": "cantor.responsabilidad.cuida_insumos",
            "label": "Cuida insumos."
          },
          {
            "key": "cantor.responsabilidad.evita_desperdicios",
            "label": "Evita desperdicios."
          },
          {
            "key": "cantor.responsabilidad.reporta_problemas",
            "label": "Reporta problemas."
          },
          {
            "key": "cantor.responsabilidad.tiene_iniciativa",
            "label": "Tiene iniciativa."
          },
          {
            "key": "cantor.responsabilidad.cumple_procedimientos",
            "label": "Cumple procedimientos."
          },
          {
            "key": "cantor.responsabilidad.es_confiable",
            "label": "Es confiable."
          }
        ]
      },
      {
        "id": "kpi",
        "titulo": "KPI del cantor",
        "items": [
          {
            "key": "cantor.kpi.errores_de_lectura_de_comandas",
            "label": "Errores de lectura de comandas."
          },
          {
            "key": "cantor.kpi.pedidos_confundidos",
            "label": "Pedidos confundidos."
          },
          {
            "key": "cantor.kpi.pedidos_omitidos",
            "label": "Pedidos omitidos."
          },
          {
            "key": "cantor.kpi.tiempo_de_respuesta",
            "label": "Tiempo de respuesta."
          },
          {
            "key": "cantor.kpi.veces_que_la_plancha_quedo_desabastecida",
            "label": "Veces que la plancha quedó desabastecida."
          },
          {
            "key": "cantor.kpi.tiempo_de_reposicion_de_insumos",
            "label": "Tiempo de reposición de insumos."
          },
          {
            "key": "cantor.kpi.fluidez_operativa_durante_horas_punta",
            "label": "Fluidez operativa durante horas punta."
          },
          {
            "key": "cantor.kpi.pedidos_procesados_por_hora",
            "label": "Pedidos procesados por hora."
          },
          {
            "key": "cantor.kpi.cumplimiento_de_lavado",
            "label": "Cumplimiento de lavado."
          },
          {
            "key": "cantor.kpi.estado_de_orden_de_la_estacion",
            "label": "Estado de orden de la estación."
          },
          {
            "key": "cantor.kpi.cumplimiento_de_protocolos_de_limpieza",
            "label": "Cumplimiento de protocolos de limpieza."
          },
          {
            "key": "cantor.kpi.evaluacion_del_planchero",
            "label": "Evaluación del planchero."
          },
          {
            "key": "cantor.kpi.evaluacion_del_cocinero",
            "label": "Evaluación del cocinero."
          },
          {
            "key": "cantor.kpi.evaluacion_del_administrador",
            "label": "Evaluación del administrador."
          }
        ]
      }
    ],
    "totalItems": 94
  },
  "ayudante_cocina": {
    "id": "ayudante_cocina",
    "titulo": "Ayudante de cocina – Matriz de habilidades",
    "categorias": [
      {
        "id": "preparacion_insumos",
        "titulo": "Preparación de insumos",
        "items": [
          {
            "key": "ayudante_cocina.preparacion_insumos.pela_camote_correctamente",
            "label": "Pela camote correctamente."
          },
          {
            "key": "ayudante_cocina.preparacion_insumos.corta_camote_con_tamano_uniforme",
            "label": "Corta camote con tamaño uniforme."
          },
          {
            "key": "ayudante_cocina.preparacion_insumos.selecciona_camote_de_buena_calidad",
            "label": "Selecciona camote de buena calidad."
          },
          {
            "key": "ayudante_cocina.preparacion_insumos.lava_insumos_correctamente",
            "label": "Lava insumos correctamente."
          },
          {
            "key": "ayudante_cocina.preparacion_insumos.prepara_cebolla_para_zarza",
            "label": "Prepara cebolla para zarza."
          },
          {
            "key": "ayudante_cocina.preparacion_insumos.corta_cebolla_de_manera_uniforme",
            "label": "Corta cebolla de manera uniforme."
          },
          {
            "key": "ayudante_cocina.preparacion_insumos.prepara_limon_y_condimentos",
            "label": "Prepara limón y condimentos."
          },
          {
            "key": "ayudante_cocina.preparacion_insumos.prepara_salsas_segun_receta",
            "label": "Prepara salsas según receta."
          },
          {
            "key": "ayudante_cocina.preparacion_insumos.mantiene_insumos_listos_antes_de_horas_punta",
            "label": "Mantiene insumos listos antes de horas punta."
          },
          {
            "key": "ayudante_cocina.preparacion_insumos.sigue_recetas_y_procedimientos",
            "label": "Sigue recetas y procedimientos."
          },
          {
            "key": "ayudante_cocina.preparacion_insumos.prepara_hamburguesa",
            "label": "Prepara hamburguesa."
          },
          {
            "key": "ayudante_cocina.preparacion_insumos.prepara_el_asado",
            "label": "Prepara el ASADO."
          },
          {
            "key": "ayudante_cocina.preparacion_insumos.prepara_pollo",
            "label": "Prepara pollo."
          },
          {
            "key": "ayudante_cocina.preparacion_insumos.prepara_el_caldo_para_la_sopa_especial",
            "label": "Prepara el caldo para la sopa especial."
          },
          {
            "key": "ayudante_cocina.preparacion_insumos.prepara_la_mayonesa",
            "label": "Prepara la mayonesa."
          }
        ]
      },
      {
        "id": "produccion_chicharron",
        "titulo": "Producción de chicharrón",
        "items": [
          {
            "key": "ayudante_cocina.produccion_chicharron.conoce_el_proceso_de_coccion",
            "label": "Conoce el proceso de cocción."
          },
          {
            "key": "ayudante_cocina.produccion_chicharron.controla_tiempos_de_coccion",
            "label": "Controla tiempos de cocción."
          },
          {
            "key": "ayudante_cocina.produccion_chicharron.controla_temperatura",
            "label": "Controla temperatura."
          },
          {
            "key": "ayudante_cocina.produccion_chicharron.identifica_punto_correcto_del_chicharron",
            "label": "Identifica punto correcto del chicharrón."
          },
          {
            "key": "ayudante_cocina.produccion_chicharron.obtiene_textura_adecuada",
            "label": "Obtiene textura adecuada."
          },
          {
            "key": "ayudante_cocina.produccion_chicharron.obtiene_color_adecuado",
            "label": "Obtiene color adecuado."
          },
          {
            "key": "ayudante_cocina.produccion_chicharron.evita_sobrecoccion",
            "label": "Evita sobrecocción."
          },
          {
            "key": "ayudante_cocina.produccion_chicharron.evita_productos_quemados",
            "label": "Evita productos quemados."
          },
          {
            "key": "ayudante_cocina.produccion_chicharron.mantiene_calidad_constante",
            "label": "Mantiene calidad constante."
          },
          {
            "key": "ayudante_cocina.produccion_chicharron.aprovecha_correctamente_la_materia_prima",
            "label": "Aprovecha correctamente la materia prima."
          }
        ]
      },
      {
        "id": "produccion_camote",
        "titulo": "Producción de camote frito",
        "items": [
          {
            "key": "ayudante_cocina.produccion_camote.frie_camote_correctamente",
            "label": "Fríe camote correctamente."
          },
          {
            "key": "ayudante_cocina.produccion_camote.controla_temperatura_del_aceite",
            "label": "Controla temperatura del aceite."
          },
          {
            "key": "ayudante_cocina.produccion_camote.obtiene_color_uniforme",
            "label": "Obtiene color uniforme."
          },
          {
            "key": "ayudante_cocina.produccion_camote.obtiene_textura_crocante",
            "label": "Obtiene textura crocante."
          },
          {
            "key": "ayudante_cocina.produccion_camote.evita_camotes_quemados",
            "label": "Evita camotes quemados."
          },
          {
            "key": "ayudante_cocina.produccion_camote.evita_camotes_crudos",
            "label": "Evita camotes crudos."
          },
          {
            "key": "ayudante_cocina.produccion_camote.mantiene_produccion_constante",
            "label": "Mantiene producción constante."
          },
          {
            "key": "ayudante_cocina.produccion_camote.calcula_cantidades_necesarias",
            "label": "Calcula cantidades necesarias."
          },
          {
            "key": "ayudante_cocina.produccion_camote.reduce_desperdicio",
            "label": "Reduce desperdicio."
          },
          {
            "key": "ayudante_cocina.produccion_camote.mantiene_calidad_uniforme",
            "label": "Mantiene calidad uniforme."
          }
        ]
      },
      {
        "id": "abastecimiento",
        "titulo": "Abastecimiento",
        "items": [
          {
            "key": "ayudante_cocina.abastecimiento.mantiene_stock_de_camote",
            "label": "Mantiene stock de camote."
          },
          {
            "key": "ayudante_cocina.abastecimiento.mantiene_stock_de_cebolla",
            "label": "Mantiene stock de cebolla."
          },
          {
            "key": "ayudante_cocina.abastecimiento.mantiene_stock_de_chicharron",
            "label": "Mantiene stock de chicharrón."
          },
          {
            "key": "ayudante_cocina.abastecimiento.mantiene_stock_de_asado",
            "label": "Mantiene stock de asado."
          },
          {
            "key": "ayudante_cocina.abastecimiento.mantiene_stock_de_pollo",
            "label": "Mantiene stock de pollo."
          },
          {
            "key": "ayudante_cocina.abastecimiento.mantiene_stock_de_aji",
            "label": "Mantiene stock de aji."
          },
          {
            "key": "ayudante_cocina.abastecimiento.mantiene_stock_de_mayonesa",
            "label": "Mantiene stock de mayonesa."
          },
          {
            "key": "ayudante_cocina.abastecimiento.mantiene_stock_de_cremas",
            "label": "Mantiene stock de cremas."
          },
          {
            "key": "ayudante_cocina.abastecimiento.anticipa_necesidades",
            "label": "Anticipa necesidades."
          },
          {
            "key": "ayudante_cocina.abastecimiento.reporta_faltantes",
            "label": "Reporta faltantes."
          },
          {
            "key": "ayudante_cocina.abastecimiento.evita_quiebres_de_stock",
            "label": "Evita quiebres de stock."
          },
          {
            "key": "ayudante_cocina.abastecimiento.mantiene_produccion_adelantada",
            "label": "Mantiene producción adelantada."
          },
          {
            "key": "ayudante_cocina.abastecimiento.coordina_con_plancha",
            "label": "Coordina con plancha."
          },
          {
            "key": "ayudante_cocina.abastecimiento.coordina_con_cantor",
            "label": "Coordina con cantor."
          },
          {
            "key": "ayudante_cocina.abastecimiento.coordina_con_administracion",
            "label": "Coordina con administración."
          }
        ]
      },
      {
        "id": "velocidad_productividad",
        "titulo": "Velocidad y productividad",
        "items": [
          {
            "key": "ayudante_cocina.velocidad_productividad.trabaja_con_rapidez",
            "label": "Trabaja con rapidez."
          },
          {
            "key": "ayudante_cocina.velocidad_productividad.cumple_tiempos_de_produccion",
            "label": "Cumple tiempos de producción."
          },
          {
            "key": "ayudante_cocina.velocidad_productividad.aprovecha_tiempos_muertos",
            "label": "Aprovecha tiempos muertos."
          },
          {
            "key": "ayudante_cocina.velocidad_productividad.mantiene_ritmo_constante",
            "label": "Mantiene ritmo constante."
          },
          {
            "key": "ayudante_cocina.velocidad_productividad.prioriza_tareas_correctamente",
            "label": "Prioriza tareas correctamente."
          },
          {
            "key": "ayudante_cocina.velocidad_productividad.trabaja_bien_bajo_presion",
            "label": "Trabaja bien bajo presión."
          },
          {
            "key": "ayudante_cocina.velocidad_productividad.cumple_metas_diarias",
            "label": "Cumple metas diarias."
          },
          {
            "key": "ayudante_cocina.velocidad_productividad.mantiene_productividad_durante_todo_el_turno",
            "label": "Mantiene productividad durante todo el turno."
          },
          {
            "key": "ayudante_cocina.velocidad_productividad.responde_rapidamente_a_pedidos_urgentes",
            "label": "Responde rápidamente a pedidos urgentes."
          },
          {
            "key": "ayudante_cocina.velocidad_productividad.evita_retrasos_en_produccion",
            "label": "Evita retrasos en producción."
          }
        ]
      },
      {
        "id": "control_calidad",
        "titulo": "Control de calidad",
        "items": [
          {
            "key": "ayudante_cocina.control_calidad.verifica_calidad_del_camote",
            "label": "Verifica calidad del camote."
          },
          {
            "key": "ayudante_cocina.control_calidad.verifica_calidad_de_la_cebolla",
            "label": "Verifica calidad de la cebolla."
          },
          {
            "key": "ayudante_cocina.control_calidad.verifica_calidad_del_chicharron",
            "label": "Verifica calidad del chicharrón."
          },
          {
            "key": "ayudante_cocina.control_calidad.verifica_calidad_del_asado",
            "label": "Verifica calidad del asado."
          },
          {
            "key": "ayudante_cocina.control_calidad.verifica_calidad_del_pollo",
            "label": "Verifica calidad del pollo."
          },
          {
            "key": "ayudante_cocina.control_calidad.detecta_productos_defectuosos",
            "label": "Detecta productos defectuosos."
          },
          {
            "key": "ayudante_cocina.control_calidad.corrige_errores_antes_de_servir",
            "label": "Corrige errores antes de servir."
          },
          {
            "key": "ayudante_cocina.control_calidad.mantiene_estandares_belu",
            "label": "Mantiene estándares BELÚ."
          },
          {
            "key": "ayudante_cocina.control_calidad.sigue_fichas_tecnicas",
            "label": "Sigue fichas técnicas."
          },
          {
            "key": "ayudante_cocina.control_calidad.respeta_gramajes",
            "label": "Respeta gramajes."
          },
          {
            "key": "ayudante_cocina.control_calidad.mantiene_uniformidad",
            "label": "Mantiene uniformidad."
          },
          {
            "key": "ayudante_cocina.control_calidad.cuida_la_presentacion_de_insumos",
            "label": "Cuida la presentación de insumos."
          }
        ]
      },
      {
        "id": "limpieza_higiene",
        "titulo": "Limpieza e higiene",
        "items": [
          {
            "key": "ayudante_cocina.limpieza_higiene.mantiene_area_limpia",
            "label": "Mantiene área limpia."
          },
          {
            "key": "ayudante_cocina.limpieza_higiene.lava_utensilios_correctamente",
            "label": "Lava utensilios correctamente."
          },
          {
            "key": "ayudante_cocina.limpieza_higiene.lava_recipientes_oportunamente",
            "label": "Lava recipientes oportunamente."
          },
          {
            "key": "ayudante_cocina.limpieza_higiene.mantiene_pisos_limpios",
            "label": "Mantiene pisos limpios."
          },
          {
            "key": "ayudante_cocina.limpieza_higiene.mantiene_freidoras_limpias",
            "label": "Mantiene freidoras limpias."
          },
          {
            "key": "ayudante_cocina.limpieza_higiene.mantiene_tablas_limpias",
            "label": "Mantiene tablas limpias."
          },
          {
            "key": "ayudante_cocina.limpieza_higiene.evita_contaminacion_cruzada",
            "label": "Evita contaminación cruzada."
          },
          {
            "key": "ayudante_cocina.limpieza_higiene.usa_uniforme_correctamente",
            "label": "Usa uniforme correctamente."
          },
          {
            "key": "ayudante_cocina.limpieza_higiene.cumple_protocolos_sanitarios",
            "label": "Cumple protocolos sanitarios."
          },
          {
            "key": "ayudante_cocina.limpieza_higiene.mantiene_orden_permanente",
            "label": "Mantiene orden permanente."
          }
        ]
      },
      {
        "id": "control_desperdicios",
        "titulo": "Control de desperdicios",
        "items": [
          {
            "key": "ayudante_cocina.control_desperdicios.reduce_merma_de_camote",
            "label": "Reduce merma de camote."
          },
          {
            "key": "ayudante_cocina.control_desperdicios.reduce_merma_de_cebolla",
            "label": "Reduce merma de cebolla."
          },
          {
            "key": "ayudante_cocina.control_desperdicios.reduce_merma_de_chicharron",
            "label": "Reduce merma de chicharrón."
          },
          {
            "key": "ayudante_cocina.control_desperdicios.reduce_merma_de_asado",
            "label": "Reduce merma de asado."
          },
          {
            "key": "ayudante_cocina.control_desperdicios.reduce_merma_de_pollo",
            "label": "Reduce merma de pollo."
          },
          {
            "key": "ayudante_cocina.control_desperdicios.reduce_merma_de_hamburguesa",
            "label": "Reduce merma de hamburguesa."
          },
          {
            "key": "ayudante_cocina.control_desperdicios.aprovecha_correctamente_insumos",
            "label": "Aprovecha correctamente insumos."
          },
          {
            "key": "ayudante_cocina.control_desperdicios.reporta_perdidas",
            "label": "Reporta pérdidas."
          },
          {
            "key": "ayudante_cocina.control_desperdicios.controla_consumo_de_aceite",
            "label": "Controla consumo de aceite."
          },
          {
            "key": "ayudante_cocina.control_desperdicios.evita_excesos_de_produccion",
            "label": "Evita excesos de producción."
          },
          {
            "key": "ayudante_cocina.control_desperdicios.cuida_los_costos",
            "label": "Cuida los costos."
          },
          {
            "key": "ayudante_cocina.control_desperdicios.usa_correctamente_herramientas",
            "label": "Usa correctamente herramientas."
          },
          {
            "key": "ayudante_cocina.control_desperdicios.mantiene_mentalidad_de_ahorro",
            "label": "Mantiene mentalidad de ahorro."
          }
        ]
      },
      {
        "id": "trabajo_equipo_actitud",
        "titulo": "Trabajo en equipo y actitud",
        "items": [
          {
            "key": "ayudante_cocina.trabajo_equipo_actitud.ayuda_a_companeros",
            "label": "Ayuda a compañeros."
          },
          {
            "key": "ayudante_cocina.trabajo_equipo_actitud.mantiene_buena_comunicacion",
            "label": "Mantiene buena comunicación."
          },
          {
            "key": "ayudante_cocina.trabajo_equipo_actitud.sigue_instrucciones",
            "label": "Sigue instrucciones."
          },
          {
            "key": "ayudante_cocina.trabajo_equipo_actitud.acepta_correcciones",
            "label": "Acepta correcciones."
          },
          {
            "key": "ayudante_cocina.trabajo_equipo_actitud.tiene_iniciativa",
            "label": "Tiene iniciativa."
          },
          {
            "key": "ayudante_cocina.trabajo_equipo_actitud.mantiene_actitud_positiva",
            "label": "Mantiene actitud positiva."
          },
          {
            "key": "ayudante_cocina.trabajo_equipo_actitud.colabora_en_horas_punta",
            "label": "Colabora en horas punta."
          },
          {
            "key": "ayudante_cocina.trabajo_equipo_actitud.se_adapta_a_cambios",
            "label": "Se adapta a cambios."
          },
          {
            "key": "ayudante_cocina.trabajo_equipo_actitud.es_respetuoso",
            "label": "Es respetuoso."
          },
          {
            "key": "ayudante_cocina.trabajo_equipo_actitud.es_confiable",
            "label": "Es confiable."
          }
        ]
      },
      {
        "id": "kpi",
        "titulo": "KPI del ayudante de cocina",
        "items": [
          {
            "key": "ayudante_cocina.kpi.kilos_de_chicharron_producidos",
            "label": "Kilos de chicharrón producidos."
          },
          {
            "key": "ayudante_cocina.kpi.kilos_de_camote_preparados",
            "label": "Kilos de camote preparados."
          },
          {
            "key": "ayudante_cocina.kpi.cantidad_de_zarza_preparada",
            "label": "Cantidad de zarza preparada."
          },
          {
            "key": "ayudante_cocina.kpi.tiempo_de_preparacion",
            "label": "Tiempo de preparación."
          },
          {
            "key": "ayudante_cocina.kpi.reclamos_por_calidad",
            "label": "Reclamos por calidad."
          },
          {
            "key": "ayudante_cocina.kpi.productos_quemados",
            "label": "Productos quemados."
          },
          {
            "key": "ayudante_cocina.kpi.productos_crudos",
            "label": "Productos crudos."
          },
          {
            "key": "ayudante_cocina.kpi.cumplimiento_de_estandares",
            "label": "Cumplimiento de estándares."
          },
          {
            "key": "ayudante_cocina.kpi.veces_que_falto_camote",
            "label": "Veces que faltó camote."
          },
          {
            "key": "ayudante_cocina.kpi.veces_que_falto_zarza",
            "label": "Veces que faltó zarza."
          },
          {
            "key": "ayudante_cocina.kpi.veces_que_falto_chicharron",
            "label": "Veces que faltó chicharrón."
          },
          {
            "key": "ayudante_cocina.kpi.tiempo_de_reposicion",
            "label": "Tiempo de reposición."
          },
          {
            "key": "ayudante_cocina.kpi.merma_de_camote",
            "label": "Merma de camote (%)."
          },
          {
            "key": "ayudante_cocina.kpi.merma_de_cebolla",
            "label": "Merma de cebolla (%)."
          },
          {
            "key": "ayudante_cocina.kpi.merma_de_chicharron",
            "label": "Merma de chicharrón (%)."
          },
          {
            "key": "ayudante_cocina.kpi.consumo_de_aceite",
            "label": "Consumo de aceite."
          },
          {
            "key": "ayudante_cocina.kpi.evaluacion_de_orden",
            "label": "Evaluación de orden."
          },
          {
            "key": "ayudante_cocina.kpi.evaluacion_de_higiene",
            "label": "Evaluación de higiene."
          },
          {
            "key": "ayudante_cocina.kpi.cumplimiento_de_protocolos",
            "label": "Cumplimiento de protocolos."
          }
        ]
      }
    ],
    "totalItems": 124
  },
  "liquidos": {
    "id": "liquidos",
    "titulo": "Encargado de líquidos / jugos",
    "categorias": [
      {
        "id": "conocimiento_productos",
        "titulo": "Conocimiento de productos",
        "items": [
          {
            "key": "liquidos.conocimiento_productos.conoce_toda_la_carta_de_bebidas",
            "label": "Conoce toda la carta de bebidas."
          },
          {
            "key": "liquidos.conocimiento_productos.conoce_todas_las_recetas",
            "label": "Conoce todas las recetas."
          },
          {
            "key": "liquidos.conocimiento_productos.conoce_las_medidas_exactas",
            "label": "Conoce las medidas exactas."
          },
          {
            "key": "liquidos.conocimiento_productos.conoce_las_promociones_vigentes",
            "label": "Conoce las promociones vigentes."
          },
          {
            "key": "liquidos.conocimiento_productos.identifica_cada_bebida_rapidamente",
            "label": "Identifica cada bebida rápidamente."
          },
          {
            "key": "liquidos.conocimiento_productos.conoce_ingredientes_y_combinaciones",
            "label": "Conoce ingredientes y combinaciones."
          },
          {
            "key": "liquidos.conocimiento_productos.conoce_tiempos_de_preparacion",
            "label": "Conoce tiempos de preparación."
          },
          {
            "key": "liquidos.conocimiento_productos.conoce_estandares_de_presentacion",
            "label": "Conoce estándares de presentación."
          },
          {
            "key": "liquidos.conocimiento_productos.conoce_procedimientos_de_higiene",
            "label": "Conoce procedimientos de higiene."
          },
          {
            "key": "liquidos.conocimiento_productos.conoce_control_de_insumos",
            "label": "Conoce control de insumos."
          }
        ]
      },
      {
        "id": "preparacion_jugos",
        "titulo": "Preparación de jugos",
        "items": [
          {
            "key": "liquidos.preparacion_jugos.respeta_recetas",
            "label": "Respeta recetas."
          },
          {
            "key": "liquidos.preparacion_jugos.mantiene_sabor_uniforme",
            "label": "Mantiene sabor uniforme."
          },
          {
            "key": "liquidos.preparacion_jugos.mantiene_textura_adecuada",
            "label": "Mantiene textura adecuada."
          },
          {
            "key": "liquidos.preparacion_jugos.mantiene_temperatura_adecuada",
            "label": "Mantiene temperatura adecuada."
          },
          {
            "key": "liquidos.preparacion_jugos.utiliza_cantidades_correctas",
            "label": "Utiliza cantidades correctas."
          },
          {
            "key": "liquidos.preparacion_jugos.mide_correctamente_azucar_o_endulzantes",
            "label": "Mide correctamente azúcar o endulzantes."
          },
          {
            "key": "liquidos.preparacion_jugos.mide_correctamente_agua_o_leche",
            "label": "Mide correctamente agua o leche."
          },
          {
            "key": "liquidos.preparacion_jugos.prepara_pedidos_sin_errores",
            "label": "Prepara pedidos sin errores."
          },
          {
            "key": "liquidos.preparacion_jugos.mantiene_calidad_constante",
            "label": "Mantiene calidad constante."
          },
          {
            "key": "liquidos.preparacion_jugos.cumple_estandares_belu",
            "label": "Cumple estándares BELÚ."
          }
        ]
      },
      {
        "id": "velocidad_preparacion",
        "titulo": "Velocidad de preparación",
        "items": [
          {
            "key": "liquidos.velocidad_preparacion.prepara_bebidas_rapidamente",
            "label": "Prepara bebidas rápidamente."
          },
          {
            "key": "liquidos.velocidad_preparacion.atiende_varios_pedidos_simultaneamente",
            "label": "Atiende varios pedidos simultáneamente."
          },
          {
            "key": "liquidos.velocidad_preparacion.mantiene_ritmo_constante",
            "label": "Mantiene ritmo constante."
          },
          {
            "key": "liquidos.velocidad_preparacion.trabaja_bien_en_horas_punta",
            "label": "Trabaja bien en horas punta."
          },
          {
            "key": "liquidos.velocidad_preparacion.reduce_tiempos_de_espera",
            "label": "Reduce tiempos de espera."
          },
          {
            "key": "liquidos.velocidad_preparacion.prioriza_correctamente",
            "label": "Prioriza correctamente."
          },
          {
            "key": "liquidos.velocidad_preparacion.responde_a_pedidos_urgentes",
            "label": "Responde a pedidos urgentes."
          },
          {
            "key": "liquidos.velocidad_preparacion.mantiene_flujo_continuo",
            "label": "Mantiene flujo continuo."
          },
          {
            "key": "liquidos.velocidad_preparacion.evita_acumulacion_de_pedidos",
            "label": "Evita acumulación de pedidos."
          },
          {
            "key": "liquidos.velocidad_preparacion.aprovecha_tiempos_muertos",
            "label": "Aprovecha tiempos muertos."
          }
        ]
      },
      {
        "id": "calidad_producto",
        "titulo": "Calidad del producto",
        "items": [
          {
            "key": "liquidos.calidad_producto.verifica_sabor_antes_de_entregar",
            "label": "Verifica sabor antes de entregar."
          },
          {
            "key": "liquidos.calidad_producto.verifica_presentacion",
            "label": "Verifica presentación."
          },
          {
            "key": "liquidos.calidad_producto.verifica_temperatura",
            "label": "Verifica temperatura."
          },
          {
            "key": "liquidos.calidad_producto.verifica_cantidades",
            "label": "Verifica cantidades."
          },
          {
            "key": "liquidos.calidad_producto.evita_bebidas_aguadas",
            "label": "Evita bebidas aguadas."
          },
          {
            "key": "liquidos.calidad_producto.evita_bebidas_demasiado_concentradas",
            "label": "Evita bebidas demasiado concentradas."
          },
          {
            "key": "liquidos.calidad_producto.mantiene_uniformidad",
            "label": "Mantiene uniformidad."
          },
          {
            "key": "liquidos.calidad_producto.corrige_errores_antes_de_entregar",
            "label": "Corrige errores antes de entregar."
          },
          {
            "key": "liquidos.calidad_producto.minimiza_reclamos",
            "label": "Minimiza reclamos."
          },
          {
            "key": "liquidos.calidad_producto.cuida_la_imagen_del_producto",
            "label": "Cuida la imagen del producto."
          }
        ]
      },
      {
        "id": "control_insumos",
        "titulo": "Control de insumos",
        "items": [
          {
            "key": "liquidos.control_insumos.controla_frutas",
            "label": "Controla frutas."
          },
          {
            "key": "liquidos.control_insumos.controla_leche",
            "label": "Controla leche."
          },
          {
            "key": "liquidos.control_insumos.controla_azucar",
            "label": "Controla azúcar."
          },
          {
            "key": "liquidos.control_insumos.controla_hielo",
            "label": "Controla hielo."
          },
          {
            "key": "liquidos.control_insumos.controla_cafe",
            "label": "Controla café."
          },
          {
            "key": "liquidos.control_insumos.controla_envases",
            "label": "Controla envases."
          },
          {
            "key": "liquidos.control_insumos.reporta_faltantes",
            "label": "Reporta faltantes."
          },
          {
            "key": "liquidos.control_insumos.anticipa_necesidades",
            "label": "Anticipa necesidades."
          },
          {
            "key": "liquidos.control_insumos.evita_desperdicios",
            "label": "Evita desperdicios."
          },
          {
            "key": "liquidos.control_insumos.mantiene_stock_suficiente",
            "label": "Mantiene stock suficiente."
          }
        ]
      },
      {
        "id": "limpieza_higiene",
        "titulo": "Limpieza e higiene",
        "items": [
          {
            "key": "liquidos.limpieza_higiene.mantiene_licuadoras_limpias",
            "label": "Mantiene licuadoras limpias."
          },
          {
            "key": "liquidos.limpieza_higiene.mantiene_estacion_limpia",
            "label": "Mantiene estación limpia."
          },
          {
            "key": "liquidos.limpieza_higiene.lava_utensilios_oportunamente",
            "label": "Lava utensilios oportunamente."
          },
          {
            "key": "liquidos.limpieza_higiene.mantiene_superficies_limpias",
            "label": "Mantiene superficies limpias."
          },
          {
            "key": "liquidos.limpieza_higiene.manipula_alimentos_correctamente",
            "label": "Manipula alimentos correctamente."
          },
          {
            "key": "liquidos.limpieza_higiene.usa_uniforme_correctamente",
            "label": "Usa uniforme correctamente."
          },
          {
            "key": "liquidos.limpieza_higiene.cumple_protocolos_sanitarios",
            "label": "Cumple protocolos sanitarios."
          },
          {
            "key": "liquidos.limpieza_higiene.evita_contaminacion_cruzada",
            "label": "Evita contaminación cruzada."
          },
          {
            "key": "liquidos.limpieza_higiene.mantiene_orden_constante",
            "label": "Mantiene orden constante."
          },
          {
            "key": "liquidos.limpieza_higiene.mantiene_buena_presentacion_personal",
            "label": "Mantiene buena presentación personal."
          }
        ]
      },
      {
        "id": "control_desperdicios",
        "titulo": "Control de desperdicios",
        "items": [
          {
            "key": "liquidos.control_desperdicios.reduce_desperdicio_de_fruta",
            "label": "Reduce desperdicio de fruta."
          },
          {
            "key": "liquidos.control_desperdicios.reduce_desperdicio_de_leche",
            "label": "Reduce desperdicio de leche."
          },
          {
            "key": "liquidos.control_desperdicios.reduce_desperdicio_de_hielo",
            "label": "Reduce desperdicio de hielo."
          },
          {
            "key": "liquidos.control_desperdicios.reduce_desperdicio_de_insumos",
            "label": "Reduce desperdicio de insumos."
          },
          {
            "key": "liquidos.control_desperdicios.aprovecha_correctamente_los_productos",
            "label": "Aprovecha correctamente los productos."
          },
          {
            "key": "liquidos.control_desperdicios.cuida_costos",
            "label": "Cuida costos."
          },
          {
            "key": "liquidos.control_desperdicios.respeta_porciones",
            "label": "Respeta porciones."
          },
          {
            "key": "liquidos.control_desperdicios.reporta_perdidas",
            "label": "Reporta pérdidas."
          },
          {
            "key": "liquidos.control_desperdicios.evita_sobreproduccion",
            "label": "Evita sobreproducción."
          },
          {
            "key": "liquidos.control_desperdicios.mantiene_rentabilidad",
            "label": "Mantiene rentabilidad."
          }
        ]
      },
      {
        "id": "trabajo_equipo",
        "titulo": "Trabajo en equipo",
        "items": [
          {
            "key": "liquidos.trabajo_equipo.coordina_con_cajero",
            "label": "Coordina con cajero."
          },
          {
            "key": "liquidos.trabajo_equipo.coordina_con_mozos",
            "label": "Coordina con mozos."
          },
          {
            "key": "liquidos.trabajo_equipo.coordina_con_cocina",
            "label": "Coordina con cocina."
          },
          {
            "key": "liquidos.trabajo_equipo.coordina_con_despacho",
            "label": "Coordina con despacho."
          },
          {
            "key": "liquidos.trabajo_equipo.ayuda_a_companeros",
            "label": "Ayuda a compañeros."
          },
          {
            "key": "liquidos.trabajo_equipo.mantiene_buena_comunicacion",
            "label": "Mantiene buena comunicación."
          },
          {
            "key": "liquidos.trabajo_equipo.acepta_correcciones",
            "label": "Acepta correcciones."
          },
          {
            "key": "liquidos.trabajo_equipo.tiene_actitud_positiva",
            "label": "Tiene actitud positiva."
          },
          {
            "key": "liquidos.trabajo_equipo.colabora_en_horas_punta",
            "label": "Colabora en horas punta."
          },
          {
            "key": "liquidos.trabajo_equipo.mantiene_respeto_y_profesionalismo",
            "label": "Mantiene respeto y profesionalismo."
          }
        ]
      },
      {
        "id": "responsabilidad",
        "titulo": "Responsabilidad",
        "items": [
          {
            "key": "liquidos.responsabilidad.llega_puntual",
            "label": "Llega puntual."
          },
          {
            "key": "liquidos.responsabilidad.cumple_horarios",
            "label": "Cumple horarios."
          },
          {
            "key": "liquidos.responsabilidad.sigue_procedimientos",
            "label": "Sigue procedimientos."
          },
          {
            "key": "liquidos.responsabilidad.cuida_equipos",
            "label": "Cuida equipos."
          },
          {
            "key": "liquidos.responsabilidad.cuida_licuadoras_y_utensilios",
            "label": "Cuida licuadoras y utensilios."
          },
          {
            "key": "liquidos.responsabilidad.tiene_iniciativa",
            "label": "Tiene iniciativa."
          },
          {
            "key": "liquidos.responsabilidad.reporta_problemas",
            "label": "Reporta problemas."
          },
          {
            "key": "liquidos.responsabilidad.cumple_metas",
            "label": "Cumple metas."
          },
          {
            "key": "liquidos.responsabilidad.mantiene_disciplina",
            "label": "Mantiene disciplina."
          },
          {
            "key": "liquidos.responsabilidad.es_confiable",
            "label": "Es confiable."
          }
        ]
      },
      {
        "id": "kpi",
        "titulo": "KPI del encargado de líquidos",
        "items": [
          {
            "key": "liquidos.kpi.jugos_preparados_por_hora",
            "label": "Jugos preparados por hora."
          },
          {
            "key": "liquidos.kpi.tiempo_promedio_por_bebida",
            "label": "Tiempo promedio por bebida."
          },
          {
            "key": "liquidos.kpi.pedidos_entregados_a_tiempo",
            "label": "Pedidos entregados a tiempo."
          },
          {
            "key": "liquidos.kpi.tiempo_de_espera_del_cliente",
            "label": "Tiempo de espera del cliente."
          },
          {
            "key": "liquidos.kpi.reclamos_por_sabor",
            "label": "Reclamos por sabor."
          },
          {
            "key": "liquidos.kpi.reclamos_por_presentacion",
            "label": "Reclamos por presentación."
          },
          {
            "key": "liquidos.kpi.errores_de_preparacion",
            "label": "Errores de preparación."
          },
          {
            "key": "liquidos.kpi.cumplimiento_de_recetas",
            "label": "Cumplimiento de recetas."
          },
          {
            "key": "liquidos.kpi.merma_de_fruta",
            "label": "Merma de fruta."
          },
          {
            "key": "liquidos.kpi.consumo_de_azucar",
            "label": "Consumo de azúcar."
          },
          {
            "key": "liquidos.kpi.consumo_de_leche",
            "label": "Consumo de leche."
          },
          {
            "key": "liquidos.kpi.desperdicio_total_de_insumos",
            "label": "Desperdicio total de insumos."
          },
          {
            "key": "liquidos.kpi.veces_que_faltaron_insumos",
            "label": "Veces que faltaron insumos."
          },
          {
            "key": "liquidos.kpi.limpieza_de_estacion",
            "label": "Limpieza de estación."
          },
          {
            "key": "liquidos.kpi.estado_de_equipos",
            "label": "Estado de equipos."
          },
          {
            "key": "liquidos.kpi.cumplimiento_de_procedimientos",
            "label": "Cumplimiento de procedimientos."
          }
        ]
      }
    ],
    "totalItems": 106
  },
  "armado_master": {
    "id": "armado_master",
    "titulo": "Master / Armado final (fuente total)",
    "categorias": [
      {
        "id": "lectura_validacion",
        "titulo": "Lectura y validación de pedidos",
        "items": [
          {
            "key": "armado_master.lectura_validacion.lee_comandas_correctamente",
            "label": "Lee comandas correctamente."
          },
          {
            "key": "armado_master.lectura_validacion.interpreta_pedidos_especiales",
            "label": "Interpreta pedidos especiales."
          },
          {
            "key": "armado_master.lectura_validacion.verifica_modificaciones_solicitadas",
            "label": "Verifica modificaciones solicitadas."
          },
          {
            "key": "armado_master.lectura_validacion.verifica_cantidad_de_productos",
            "label": "Verifica cantidad de productos."
          },
          {
            "key": "armado_master.lectura_validacion.verifica_bebidas",
            "label": "Verifica bebidas."
          },
          {
            "key": "armado_master.lectura_validacion.verifica_adicionales",
            "label": "Verifica adicionales."
          },
          {
            "key": "armado_master.lectura_validacion.verifica_promociones",
            "label": "Verifica promociones."
          },
          {
            "key": "armado_master.lectura_validacion.detecta_errores_de_produccion",
            "label": "Detecta errores de producción."
          },
          {
            "key": "armado_master.lectura_validacion.detecta_pedidos_incompletos",
            "label": "Detecta pedidos incompletos."
          },
          {
            "key": "armado_master.lectura_validacion.autoriza_la_salida_del_pedido",
            "label": "Autoriza la salida del pedido."
          }
        ]
      },
      {
        "id": "armado_bandeja",
        "titulo": "Armado de bandeja o fuente",
        "items": [
          {
            "key": "armado_master.armado_bandeja.organiza_correctamente_la_presentacion",
            "label": "Organiza correctamente la presentación."
          },
          {
            "key": "armado_master.armado_bandeja.ubica_productos_adecuadamente",
            "label": "Ubica productos adecuadamente."
          },
          {
            "key": "armado_master.armado_bandeja.mantiene_orden_visual",
            "label": "Mantiene orden visual."
          },
          {
            "key": "armado_master.armado_bandeja.cuida_la_estetica_del_pedido",
            "label": "Cuida la estética del pedido."
          },
          {
            "key": "armado_master.armado_bandeja.verifica_limpieza_de_platos_y_fuentes",
            "label": "Verifica limpieza de platos y fuentes."
          },
          {
            "key": "armado_master.armado_bandeja.verifica_envases_de_delivery",
            "label": "Verifica envases de delivery."
          },
          {
            "key": "armado_master.armado_bandeja.verifica_tapas_y_empaques",
            "label": "Verifica tapas y empaques."
          },
          {
            "key": "armado_master.armado_bandeja.verifica_cubiertos_y_servilletas",
            "label": "Verifica cubiertos y servilletas."
          },
          {
            "key": "armado_master.armado_bandeja.verifica_salsas",
            "label": "Verifica salsas."
          },
          {
            "key": "armado_master.armado_bandeja.verifica_acompanamientos",
            "label": "Verifica acompañamientos."
          }
        ]
      },
      {
        "id": "control_calidad",
        "titulo": "Control de calidad",
        "items": [
          {
            "key": "armado_master.control_calidad.revisa_presentacion_del_sanguche",
            "label": "Revisa presentación del sánguche."
          },
          {
            "key": "armado_master.control_calidad.revisa_calidad_del_pan",
            "label": "Revisa calidad del pan."
          },
          {
            "key": "armado_master.control_calidad.revisa_calidad_del_chicharron",
            "label": "Revisa calidad del chicharrón."
          },
          {
            "key": "armado_master.control_calidad.revisa_calidad_de_la_zarza",
            "label": "Revisa calidad de la zarza."
          },
          {
            "key": "armado_master.control_calidad.revisa_calidad_del_camote",
            "label": "Revisa calidad del camote."
          },
          {
            "key": "armado_master.control_calidad.revisa_calidad_de_bebidas",
            "label": "Revisa calidad de bebidas."
          },
          {
            "key": "armado_master.control_calidad.detecta_productos_defectuosos",
            "label": "Detecta productos defectuosos."
          },
          {
            "key": "armado_master.control_calidad.rechaza_productos_fuera_de_estandar",
            "label": "Rechaza productos fuera de estándar."
          },
          {
            "key": "armado_master.control_calidad.exige_correccion_inmediata",
            "label": "Exige corrección inmediata."
          },
          {
            "key": "armado_master.control_calidad.mantiene_estandares_belu",
            "label": "Mantiene estándares BELÚ."
          }
        ]
      },
      {
        "id": "precision",
        "titulo": "Precisión",
        "items": [
          {
            "key": "armado_master.precision.no_envia_pedidos_equivocados",
            "label": "No envía pedidos equivocados."
          },
          {
            "key": "armado_master.precision.no_omite_productos",
            "label": "No omite productos."
          },
          {
            "key": "armado_master.precision.no_omite_bebidas",
            "label": "No omite bebidas."
          },
          {
            "key": "armado_master.precision.no_omite_adicionales",
            "label": "No omite adicionales."
          },
          {
            "key": "armado_master.precision.no_confunde_mesas",
            "label": "No confunde mesas."
          },
          {
            "key": "armado_master.precision.no_confunde_deliverys",
            "label": "No confunde deliverys."
          },
          {
            "key": "armado_master.precision.verifica_antes_de_entregar",
            "label": "Verifica antes de entregar."
          },
          {
            "key": "armado_master.precision.mantiene_exactitud",
            "label": "Mantiene exactitud."
          },
          {
            "key": "armado_master.precision.reduce_reclamos",
            "label": "Reduce reclamos."
          },
          {
            "key": "armado_master.precision.reduce_devoluciones",
            "label": "Reduce devoluciones."
          }
        ]
      },
      {
        "id": "velocidad_operativa",
        "titulo": "Velocidad operativa",
        "items": [
          {
            "key": "armado_master.velocidad_operativa.arma_pedidos_rapidamente",
            "label": "Arma pedidos rápidamente."
          },
          {
            "key": "armado_master.velocidad_operativa.mantiene_flujo_constante",
            "label": "Mantiene flujo constante."
          },
          {
            "key": "armado_master.velocidad_operativa.no_genera_cuellos_de_botella",
            "label": "No genera cuellos de botella."
          },
          {
            "key": "armado_master.velocidad_operativa.prioriza_correctamente",
            "label": "Prioriza correctamente."
          },
          {
            "key": "armado_master.velocidad_operativa.maneja_horas_punta",
            "label": "Maneja horas punta."
          },
          {
            "key": "armado_master.velocidad_operativa.mantiene_ritmo_constante",
            "label": "Mantiene ritmo constante."
          },
          {
            "key": "armado_master.velocidad_operativa.coordina_entregas_rapidas",
            "label": "Coordina entregas rápidas."
          },
          {
            "key": "armado_master.velocidad_operativa.resuelve_problemas_operativos",
            "label": "Resuelve problemas operativos."
          },
          {
            "key": "armado_master.velocidad_operativa.anticipa_congestiones",
            "label": "Anticipa congestiones."
          },
          {
            "key": "armado_master.velocidad_operativa.mantiene_continuidad_operativa",
            "label": "Mantiene continuidad operativa."
          }
        ]
      },
      {
        "id": "coordinacion_general",
        "titulo": "Coordinación general",
        "items": [
          {
            "key": "armado_master.coordinacion_general.coordina_con_plancha",
            "label": "Coordina con plancha."
          },
          {
            "key": "armado_master.coordinacion_general.coordina_con_cantor",
            "label": "Coordina con cantor."
          },
          {
            "key": "armado_master.coordinacion_general.coordina_con_liquidos",
            "label": "Coordina con líquidos."
          },
          {
            "key": "armado_master.coordinacion_general.coordina_con_cocina",
            "label": "Coordina con cocina."
          },
          {
            "key": "armado_master.coordinacion_general.coordina_con_mozos",
            "label": "Coordina con mozos."
          },
          {
            "key": "armado_master.coordinacion_general.coordina_con_caja",
            "label": "Coordina con caja."
          },
          {
            "key": "armado_master.coordinacion_general.coordina_con_delivery",
            "label": "Coordina con delivery."
          },
          {
            "key": "armado_master.coordinacion_general.mantiene_comunicacion_clara",
            "label": "Mantiene comunicación clara."
          },
          {
            "key": "armado_master.coordinacion_general.gestiona_prioridades",
            "label": "Gestiona prioridades."
          },
          {
            "key": "armado_master.coordinacion_general.mantiene_control_de_la_operacion",
            "label": "Mantiene control de la operación."
          }
        ]
      },
      {
        "id": "liderazgo",
        "titulo": "Liderazgo",
        "items": [
          {
            "key": "armado_master.liderazgo.corrige_errores_inmediatamente",
            "label": "Corrige errores inmediatamente."
          },
          {
            "key": "armado_master.liderazgo.da_instrucciones_claras",
            "label": "Da instrucciones claras."
          },
          {
            "key": "armado_master.liderazgo.mantiene_disciplina_operativa",
            "label": "Mantiene disciplina operativa."
          },
          {
            "key": "armado_master.liderazgo.exige_estandares",
            "label": "Exige estándares."
          },
          {
            "key": "armado_master.liderazgo.motiva_al_equipo",
            "label": "Motiva al equipo."
          },
          {
            "key": "armado_master.liderazgo.resuelve_conflictos",
            "label": "Resuelve conflictos."
          },
          {
            "key": "armado_master.liderazgo.toma_decisiones_rapidas",
            "label": "Toma decisiones rápidas."
          },
          {
            "key": "armado_master.liderazgo.mantiene_la_calma_bajo_presion",
            "label": "Mantiene la calma bajo presión."
          },
          {
            "key": "armado_master.liderazgo.tiene_autoridad_operativa",
            "label": "Tiene autoridad operativa."
          },
          {
            "key": "armado_master.liderazgo.es_ejemplo_para_el_equipo",
            "label": "Es ejemplo para el equipo."
          }
        ]
      },
      {
        "id": "organizacion_limpieza",
        "titulo": "Organización y limpieza",
        "items": [
          {
            "key": "armado_master.organizacion_limpieza.mantiene_estacion_ordenada",
            "label": "Mantiene estación ordenada."
          },
          {
            "key": "armado_master.organizacion_limpieza.mantiene_area_limpia",
            "label": "Mantiene área limpia."
          },
          {
            "key": "armado_master.organizacion_limpieza.mantiene_utensilios_organizados",
            "label": "Mantiene utensilios organizados."
          },
          {
            "key": "armado_master.organizacion_limpieza.mantiene_comandas_organizadas",
            "label": "Mantiene comandas organizadas."
          },
          {
            "key": "armado_master.organizacion_limpieza.evita_acumulaciones",
            "label": "Evita acumulaciones."
          },
          {
            "key": "armado_master.organizacion_limpieza.sigue_procedimientos",
            "label": "Sigue procedimientos."
          },
          {
            "key": "armado_master.organizacion_limpieza.mantiene_orden_visual",
            "label": "Mantiene orden visual."
          },
          {
            "key": "armado_master.organizacion_limpieza.mantiene_estandares_de_higiene",
            "label": "Mantiene estándares de higiene."
          },
          {
            "key": "armado_master.organizacion_limpieza.aprovecha_tiempos_muertos",
            "label": "Aprovecha tiempos muertos."
          },
          {
            "key": "armado_master.organizacion_limpieza.promueve_limpieza_constante",
            "label": "Promueve limpieza constante."
          }
        ]
      },
      {
        "id": "responsabilidad",
        "titulo": "Responsabilidad",
        "items": [
          {
            "key": "armado_master.responsabilidad.llega_puntual",
            "label": "Llega puntual."
          },
          {
            "key": "armado_master.responsabilidad.cumple_horarios",
            "label": "Cumple horarios."
          },
          {
            "key": "armado_master.responsabilidad.cuida_equipos",
            "label": "Cuida equipos."
          },
          {
            "key": "armado_master.responsabilidad.cuida_productos",
            "label": "Cuida productos."
          },
          {
            "key": "armado_master.responsabilidad.cuida_imagen_de_belu",
            "label": "Cuida imagen de BELÚ."
          },
          {
            "key": "armado_master.responsabilidad.tiene_iniciativa",
            "label": "Tiene iniciativa."
          },
          {
            "key": "armado_master.responsabilidad.reporta_problemas",
            "label": "Reporta problemas."
          },
          {
            "key": "armado_master.responsabilidad.cumple_metas",
            "label": "Cumple metas."
          },
          {
            "key": "armado_master.responsabilidad.es_confiable",
            "label": "Es confiable."
          },
          {
            "key": "armado_master.responsabilidad.actua_como_dueno_del_pedido",
            "label": "Actúa como dueño del pedido."
          }
        ]
      },
      {
        "id": "kpi",
        "titulo": "KPI del master",
        "items": [
          {
            "key": "armado_master.kpi.pedidos_devueltos",
            "label": "Pedidos devueltos."
          },
          {
            "key": "armado_master.kpi.pedidos_observados_por_clientes",
            "label": "Pedidos observados por clientes."
          },
          {
            "key": "armado_master.kpi.reclamos_por_errores",
            "label": "Reclamos por errores."
          },
          {
            "key": "armado_master.kpi.reclamos_por_faltantes",
            "label": "Reclamos por faltantes."
          },
          {
            "key": "armado_master.kpi.reclamos_por_presentacion",
            "label": "Reclamos por presentación."
          },
          {
            "key": "armado_master.kpi.pedidos_completos_entregados",
            "label": "Pedidos completos entregados."
          },
          {
            "key": "armado_master.kpi.errores_detectados_antes_de_salir",
            "label": "Errores detectados antes de salir."
          },
          {
            "key": "armado_master.kpi.errores_que_llegaron_al_cliente",
            "label": "Errores que llegaron al cliente."
          },
          {
            "key": "armado_master.kpi.porcentaje_de_pedidos_perfectos",
            "label": "Porcentaje de pedidos perfectos."
          },
          {
            "key": "armado_master.kpi.tiempo_de_armado_final",
            "label": "Tiempo de armado final."
          },
          {
            "key": "armado_master.kpi.tiempo_de_despacho",
            "label": "Tiempo de despacho."
          },
          {
            "key": "armado_master.kpi.tiempo_de_liberacion_de_pedido",
            "label": "Tiempo de liberación de pedido."
          },
          {
            "key": "armado_master.kpi.flujo_en_horas_punta",
            "label": "Flujo en horas punta."
          },
          {
            "key": "armado_master.kpi.evaluacion_del_equipo",
            "label": "Evaluación del equipo."
          },
          {
            "key": "armado_master.kpi.coordinacion_entre_areas",
            "label": "Coordinación entre áreas."
          },
          {
            "key": "armado_master.kpi.solucion_de_problemas",
            "label": "Solución de problemas."
          },
          {
            "key": "armado_master.kpi.cumplimiento_de_estandares",
            "label": "Cumplimiento de estándares."
          }
        ]
      }
    ],
    "totalItems": 107
  }
};

const CARGO_MATRIZ = {
  "Mozo/Azafata": "mozo",
  "Part time/salon": "mozo",
  "Caja": "cajero",
  "Planchero": "planchero",
  "Cantor": "cantor",
  "Ayudante de cocina": "ayudante_cocina",
  "Part time/cocina": "ayudante_cocina",
  "Líquidos": "liquidos",
  "Armado": "armado_master"
};

const UMBRALES = [30,50,70,90,100];

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
