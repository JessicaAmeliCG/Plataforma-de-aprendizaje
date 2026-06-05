### **00\_Centro\_Control\_Agentes.md**

**Instrucción de Operación:** Para garantizar cero errores de integración, cada sesión con un agente de IA debe seguir este flujo estricto:

1. Iniciar un nuevo chat/contexto limpio.  
2. Enviar el **Prompt 0 (Inicialización)** junto con tu archivo maestro `01_SRS_Requerimientos.md`.  
3. Esperar la confirmación del agente.  
4. Enviar el **Prompt de Tarea Específica** según la fase.

### **🟢 Prompt 0: Inicialización y Contexto (Obligatorio)**

"Actúa como un Ingeniero de Software Senior. A partir de este momento, eres un agente técnico del equipo de T trabajando en el proyecto 'YourCourse' (plataforma e-learning multi-tenant). Tu primera tarea es analizar y asimilar el documento `01_SRS_Requerimientos.md` que te adjunto.

**Reglas estrictas de operación:**

1. No propongas ni utilices tecnologías, librerías o frameworks que no estén explícitamente en el Stack del SRC.  
2. Respeta la arquitectura de servidor local con contenedores Docker.  
3. Mantén siempre presente la lógica Multi-Tenant y el control de acceso basado en roles (RBAC) contextuales.  
4. Todo componente visual debe incluir soporte nativo para *Dark Mode*.  
5. Limita tus respuestas a entregar el código funcional solicitado, estructurado y listo para producción, minimizando explicaciones innecesarias.

Responde ÚNICAMENTE con la frase: 'Contexto YourCourse asimilado. Sistemas listos. Esperando asignación de módulo.' si has entendido y configurado tus parámetros."

### **🛠️ Prompt 1: Agente DevOps (Fase 1 \- Infraestructura)**

"Asignación: Fase 1 \- Infraestructura base. Consulta las Secciones 2 y 5 del SRC. Tu objetivo es preparar el entorno local orquestado. Entrégame:

1. El archivo `docker-compose.yml` que levante tres servicios: `db` (PostgreSQL 15+ con volumen persistente mapeado localmente), `backend` (Node.js en puerto 3000\) y `frontend` (React/Vite en puerto 5173).  
2. El archivo `Dockerfile` optimizado para el entorno de desarrollo del Backend.  
3. El archivo `Dockerfile` optimizado para el entorno de desarrollo del Frontend. Asegúrate de incluir las variables de entorno necesarias en el compose para que los contenedores se comuniquen entre sí a nivel de red interna."

### **🗄️ Prompt 2: Agente DBA (Fase 1 \- Base de Datos)**

"Asignación: Fase 1 \- Modelado de Base de Datos. Consulta las Secciones 3 y 4 del SRC. Asumiendo que el contenedor PostgreSQL ya está configurado, necesito el script inicial de la base de datos. Entrégame el archivo `init.sql` puro con:

1. Tablas core para soportar el Multi-Tenant: `Usuarios`, `Academias` (creadores), y la tabla puente `Roles_Contextuales`.  
2. Tablas de contenido: `Cursos`, `Modulos`, `Lecciones`.  
3. Tablas de gamificación: `Registro_XP` y `Niveles`. Utiliza UUIDs como llaves primarias, incluye `created_at` y `updated_at`, y añade comentarios en las relaciones foráneas (Foreign Keys) para explicar cómo se mantiene el aislamiento de datos entre academias."

### **🔐 Prompt 3: Agente Backend (Fase 2 \- Core API y Seguridad)**

"Asignación: Fase 2 \- Seguridad y Middlewares. Consulta la Sección 3 del SRC. Con la base de datos ya diseñada, necesitamos proteger las rutas en Node.js (Express). Entrégame el código de dos archivos esenciales:

1. `authMiddleware.js`: Que valide el token JWT en las cabeceras HTTP.  
2. `roleMiddleware.js`: Un middleware dinámico que verifique si el usuario tiene permiso 'SuperAdmin' (nivel global), o si posee el rol adecuado (ej. 'Owner' o 'Editor') específicamente en el `academia_id` que se está intentando modificar. Maneja correctamente los códigos de estado HTTP (401, 403\) y utiliza buenas prácticas de inyección de dependencias."

### **🎨 Prompt 4: Agente Frontend (Fase 3 \- Layouts y UI)**

"Asignación: Fase 3 \- Maquetado y Dashboards Multi-rol. Consulta las Secciones 2 y 4 del SRC. Trabajamos con React (Vite) y Tailwind CSS. Entrégame el código para los siguientes componentes modulares:

1. `CreatorLayout.jsx`: Una envoltura (layout) que incluya una barra lateral (Sidebar) colapsable y un área principal (Outlet de React Router). Debe incluir el botón de toggle para cambiar entre modo claro y oscuro.  
2. `DashboardHome.jsx`: La vista principal del creador, que muestre un 'Grid' de Tailwind con tarjetas (Cards) de sus cursos activos y un botón prominente de 'Crear Nuevo Curso'. Obligatorio: Usa las clases `dark:` de Tailwind CSS en todos los elementos para garantizar un Dark Mode impecable con tonos neutros."

### **🎮 Prompt 5: Agente de Gamificación (Fase 4 \- Motor de Lógica)**

"Asignación: Fase 4 \- Motor de Experiencia (XP). Consulta la Sección 4 del SRC. Necesito la lógica de backend en Node.js que procese el progreso del usuario. Entrégame el archivo `gamificationEngine.js` que exporte una función o clase principal. Esta función debe:

1. Recibir un `usuario_id`, una `academia_id` y una acción (ej. `LECCION_COMPLETADA`).  
2. Calcular el XP otorgado según la acción.  
3. Calcular si la suma del nuevo XP supera el umbral del nivel actual (utilizando una fórmula exponencial o multiplicador de dificultad).  
4. Retornar un objeto JSON estructurado con el XP ganado, el XP total, y un flag booleano `levelUp` en caso de haber subido de rango."

