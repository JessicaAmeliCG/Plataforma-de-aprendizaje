01 SRS Requerimientos

\# Software Requirements Specification (SRS) \- Proyecto YourCourse

\#\# 1\. Visión General  
YourCourse es una plataforma e-learning multi-tenant diseñada para operar en servidores locales. Permite a múltiples creadores de contenido alojar, gestionar y monetizar sus propios cursos y comunidades de manera aislada, mientras una administración central (SuperAdmin) gestiona la infraestructura y comisiones.

\#\# 2\. Gestión de Usuarios y Roles (RBAC)  
Los permisos son contextuales. Un usuario puede tener múltiples roles dependiendo de la academia o el contexto global.

\*   \*\*Nivel Global (Plataforma):\*\*  
    \*   \*\*SuperAdmin:\*\* Control total de infraestructura, auditoría global, configuración de comisiones y baneo de usuarios.  
    \*   \*\*Staff / Auditor:\*\* Moderación a nivel plataforma y resolución de disputas.  
\*   \*\*Nivel Contextual (Academia/Creador):\*\*  
    \*   \*\*Creador (Owner):\*\* Control total sobre sus cursos, precios, visibilidad y su comunidad.  
    \*   \*\*Editor / Moderador:\*\* Asignado por el Creador. Gestiona foros, responde dudas y edita contenido del curso.  
\*   \*\*Nivel Consumidor:\*\*  
    \*   \*\*Estudiante Base:\*\* Consume contenido, interactúa en comunidades de los cursos adquiridos.  
    \*   \*\*Estudiante VIP/Premium:\*\* Posee una suscripción global que otorga beneficios transversales (insignias, acceso a catálogo extendido).

\#\# 3\. Módulos Core  
1\.  \*\*Autenticación y Perfiles:\*\* Login/Registro centralizado, perfiles públicos (creadores) y tableros de progreso (estudiantes).  
2\.  \*\*Gestión de Contenido (CRUD):\*\* Carga estructurada de módulos, lecciones, descripciones y material de apoyo. Soporte para enlaces externos de video para no saturar el servidor local.  
3\.  \*\*Reproductor (Player):\*\* Interfaz de consumo de video y marcado de lecciones completadas.  
4\.  \*\*Monetización:\*\* Definición de modelos de negocio por curso (Gratis, Pago Único, Suscripción).  
5\.  \*\*Comunidad:\*\* Foros de discusión anidados por curso o academia.

\#\# 4\. Gamificación y Retención  
\*   \*\*Sistema de Experiencia (XP):\*\* Puntos otorgados por acciones clave (login diario, completar lecciones, participación en foros).  
\*   \*\*Niveles Globales:\*\* Escalado algorítmico (ej. Caminante, Explorador, Erudito) que desbloquea funciones sociales.  
\*   \*\*Recompensas de Creador:\*\* Automatizaciones dentro de una academia (ej. "Al aprobar el módulo 1, desbloquear 50% de descuento en el módulo 2").

02\_Arquitectura\_y\_Tecnologias

\# Arquitectura y Stack Tecnológico \- Proyecto YourCourse

\#\# 1\. Stack Tecnológico  
\*   \*\*Frontend:\*\* React empaquetado con Vite.  
\*   \*\*Estilos:\*\* Tailwind CSS para componentes modulares y diseño responsivo.  
\*   \*\*Estado Global:\*\* Zustand (ligero y rápido para manejar la sesión del usuario).  
\*   \*\*Backend:\*\* Node.js con Express (o NestJS para mayor robustez y tipado estructurado).  
\*   \*\*Base de Datos:\*\* PostgreSQL para el manejo seguro de relaciones complejas y transacciones financieras.  
\*   \*\*Infraestructura:\*\* Docker y Docker Compose (Despliegue local y containerizado).

\#\# 2\. Esqueleto del Proyecto (Monorepo Lógico)  
\\\`\\\`\\\`text  
/YourCourse  
├── /docs  
│   ├── 01\_SRS\_Requerimientos.md  
│   ├── 02\_Arquitectura\_y\_Tecnologias.md  
│   ├── 03\_Plan\_de\_Accion\_y\_Fases.md  
│   └── 04\_Prompts\_Agentes.md  
├── /docker  
│   ├── docker-compose.yml            
│   ├── /postgres-data                
│   └── init.sql                      
├── /backend                          
│   ├── /src  
│   │   ├── /config                   
│   │   ├── /controllers              
│   │   ├── /middlewares              
│   │   ├── /models                   
│   │   ├── /routes                   
│   │   └── /services                 
│   └── Dockerfile                    
└── /frontend                         
    ├── /public                       
    ├── /src  
    │   ├── /components               
    │   ├── /context                  
    │   ├── /layouts                  
    │   ├── /pages                    
    │   └── /services                 
    └── Dockerfile                    
\\\`\\\`\\\`

\#\# 3\. Consideraciones de Servidor Local  
\*   \*\*Almacenamiento de Video:\*\* Se priorizará la integración de reproductores embebidos (iFrames de YouTube No Listado/Vimeo) para reducir la carga de ancho de banda en el servidor local.  
\*   \*\*Persistencia:\*\* Los volúmenes de Docker (\`/postgres-data\`) deben estar estrictamente mapeados para evitar pérdida de datos en reinicios del contenedor.

03\_Plan\_de\_Accion\_y\_Fases

\# Plan de Acción y Fases de Desarrollo

\#\# Fase 1: Infraestructura y Modelado de Datos (Fundamentos)  
1\. Escribir el script \`init.sql\` con la estructura relacional (Usuarios, Roles, Cursos, Módulos, etc).  
2\. Configurar \`docker-compose.yml\` para levantar PostgreSQL, Node.js y React.  
3\. Testear la conexión persistente entre los tres contenedores.

\#\# Fase 2: Autenticación y Sistema Multi-Tenant (Seguridad)  
1\. Desarrollar la API de autenticación con JWT.  
2\. Implementar middlewares para control de acceso basado en roles (RBAC).  
3\. Construir en el Frontend las rutas protegidas y los layouts diferenciados (Vista Admin vs. Vista Creador vs. Vista Estudiante).

\#\# Fase 3: Core de Cursos y Contenido (Producto Principal)  
1\. CRUD completo de cursos para el Creador (Módulos, Lecciones, Precios).  
2\. Desarrollo del reproductor de video para el estudiante.  
3\. Implementar el seguimiento de progreso (marcar como completado).

\#\# Fase 4: Motor de Gamificación y Comunidad (Retención)  
1\. Crear el algoritmo de cálculo de XP y niveles.  
2\. Integrar notificaciones de subida de nivel.  
3\. Desarrollar las tablas y endpoints para los foros de discusión.

\#\# Fase 5: Monetización y Pulido Final  
1\. Implementar simulaciones de pasarelas de pago o webhooks locales.  
2\. Dashboards de analíticas (Ventas para el Creador, Uso de sistema para el SuperAdmin).  
3\. Pruebas de estrés en el entorno local.  
