# Avance y Pendientes del Proyecto "Arbolado Chajarí"

Este documento resume las mejoras planificadas y las ideas a futuro para la aplicación.

## Mejoras Futuras (Post-MVP)

Funcionalidades y mejoras que se implementarán a corto y mediano plazo para mejorar la experiencia del usuario y la funcionalidad principal.

- **Mensaje Post-Subida:** Mostrar un mensaje claro al usuario después de subir un árbol, indicando que su registro ha sido recibido y está "pendiente de revisión" por un administrador.
- **Notificaciones Toast:** Implementar un sistema de notificaciones no intrusivas (tipo "toast") para dar feedback inmediato sobre las acciones del usuario (ej: 'Árbol añadido con éxito', 'Error al iniciar sesión').
- **Popup del Mapa Mejorado:** Refinar el popup que se muestra al hacer clic en un árbol en el mapa para incluir más detalles relevantes (ej: especie, fecha de registro, foto en miniatura).
- **Edición de Registros:** Permitir a los usuarios autenticados editar la información de los árboles que ellos mismos han registrado.
- **Perfil de Usuario:** Crear una página de perfil donde los usuarios puedan ver un listado de todos los árboles que han contribuido al mapa.

## Ideas a Largo Plazo

Conceptos e integraciones que se considerarán a medida que el proyecto crezca y evolucione.

- **Migración a Firebase Storage:** Si se activa un plan de facturación en Firebase, migrar el almacenamiento de imágenes de Google Drive a Firebase Storage para automatizar y simplificar el proceso de subida, eliminando la aprobación manual.
- **Integración con Google Street View:** Investigar la viabilidad de usar la API de Google Street View para obtener imágenes de la ubicación del árbol, como una alternativa o complemento a las fotos subidas por los usuarios.
- **Gamificación:** Desarrollar un sistema de ludificación para incentivar la participación. Esto podría incluir medallas por número de árboles registrados, rankings de usuarios y otros logros.
- **Migración a PostGIS:** Si la aplicación escala a un volumen masivo de datos y se requieren consultas geoespaciales avanzadas, considerar la migración de la base de datos a una solución más robusta como PostGIS.
- **Identificación de Especies con IA:** Integrar la API de Gemini (o un modelo similar) para analizar la foto subida por el usuario e identificar automáticamente la especie del árbol, sugiriéndola como opción predeterminada.
