Avance y Pendientes del Proyecto "Arbolado Chajarí"
Este documento resume la estrategia actual, los objetivos del MVP y las futuras mejoras para la aplicación, la cual ha pivotado hacia un modelo de enriquecimiento de datos preexistentes para mayor eficiencia y escalabilidad.
Objetivos del MVP Actual (v0.2 - El Enriquecimiento)
El objetivo de la versión actual es lanzar una aplicación funcional que permita a la comunidad verificar y catalogar una nube de puntos de árboles previamente identificados mediante análisis GIS.
[PENDIENTE] Fase 0 - Generación de Datos GIS:
Tarea externa a la app: Utilizar herramientas (ej. QGIS, Google Earth Engine) para analizar imágenes satelitales de Chajarí y generar un archivo (CSV o GeoJSON) con las coordenadas de los árboles detectados.
[PENDIENTE] Fase 1 - Carga Masiva de Datos:
Crear un script de única ejecución (ej. Node.js) para leer el archivo GIS y poblar la colección trees en Firestore. Cada árbol se creará con un campo status: 'unverified'.
[PENDIENTE] Fase 2 - Implementación del Flujo de Enriquecimiento:
Visualización de Estados: Modificar MapPage.tsx para que muestre los árboles con diferentes colores según su estado:
Gris: para status: 'unverified'.
Verde: para status: 'verified'.
Flujo de Edición: Al hacer clic en un punto gris, la app debe navegar a una página de edición (EditTreePage.tsx) pre-cargada con la ubicación del árbol.
Actualización de Estado: Al guardar los datos en el formulario de edición, se debe actualizar el documento existente en Firestore, rellenando los campos de especie, estado, etc., y cambiando el status a 'verified'.
[PENDIENTE] Filtros Básicos del Mapa:
Implementar un filtro sencillo en el mapa que permita al usuario alternar la visibilidad entre árboles "Verificados" y "Pendientes de Verificar".
Mejoras Futuras (Post-MVP)
Funcionalidades para mejorar la experiencia y la calidad de los datos una vez que el flujo principal de enriquecimiento esté funcionando.
Añadir Nuevos Árboles Manualmente: Crear una funcionalidad para que los usuarios puedan añadir un nuevo punto en el mapa si detectan un árbol que el análisis GIS omitió.
Poblar Lista de Especies: Cargar la colección species en Firestore con una lista de las variedades de árboles más comunes en la región para mejorar el desplegable del formulario.
Notificaciones Toast: Implementar notificaciones no intrusivas para dar feedback al usuario (ej: 'Árbol actualizado con éxito').
Popup Mejorado: Diseñar un popup más detallado para los puntos verdes (verificados) que muestre toda la información catalogada.
Perfil de Usuario: Crear una página de perfil donde los usuarios puedan ver un listado de todos los árboles que han "verificado" o enriquecido.
Ideas a Largo Plazo
Conceptos e integraciones a gran escala a considerar para la evolución del proyecto.
Re-introducción de Fotografías: Una vez que el MVP de enriquecimiento esté validado, planificar la reincorporación de la subida de fotos. Esto probablemente requerirá activar el plan Blaze de Firebase para usar Storage y Cloud Functions de forma robusta.
Integración con Google Street View: Investigar el uso de la API de Street View para mostrar una vista a nivel de calle de la ubicación del árbol.
Gamificación Avanzada: Expandir el concepto de "colorear el mapa". Crear medallas, rankings de "verificadores" y objetivos comunitarios (ej: "¡Cataloguemos todo el Parque San Martín!").
Migración a PostGIS: Si el proyecto crece masivamente, considerar la migración a una base de datos geoespacial especializada para consultas complejas.
Identificación de Especies con IA: (Una vez reintroducidas las fotos) Integrar la API de Gemini para analizar una foto y sugerir la especie del árbol.