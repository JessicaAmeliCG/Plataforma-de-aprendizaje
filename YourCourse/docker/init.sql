-- ============================================================
-- YourCourse — Script de Inicialización de Base de Datos
-- PostgreSQL 15+
-- Arquitectura: Multi-Tenant con RBAC contextual
-- ============================================================

-- Habilitar la extensión UUID para generar UUIDs v4
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- SECCIÓN 1: NIVEL GLOBAL — Usuarios y Plataforma
-- ============================================================

-- Tabla: niveles_globales
-- Define los niveles de experiencia de la plataforma (ej. Caminante, Explorador, Erudito)
CREATE TABLE IF NOT EXISTS niveles_globales (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre      VARCHAR(50) NOT NULL UNIQUE,
    -- XP mínimo requerido para alcanzar este nivel (fórmula: xp_requerido = base * multiplicador^(nivel-1))
    xp_requerido BIGINT     NOT NULL DEFAULT 0,
    nivel_orden  INT        NOT NULL UNIQUE, -- Posición ordinal (1=Caminante, 2=Explorador, etc.)
    descripcion  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE niveles_globales IS 'Niveles de progresión global de la plataforma. Cada nivel desbloquea funciones sociales adicionales.';

-- Tabla: usuarios
-- Registro centralizado de todos los usuarios de la plataforma
CREATE TABLE IF NOT EXISTS usuarios (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    username        VARCHAR(100) NOT NULL UNIQUE,
    password_hash   TEXT        NOT NULL, -- Almacena hash bcrypt, NUNCA contraseña en claro
    nombre_completo VARCHAR(255),
    avatar_url      TEXT,
    bio             TEXT,
    -- Rol de nivel global (SuperAdmin y Staff son roles de plataforma, no contextuales)
    rol_global      VARCHAR(50) NOT NULL DEFAULT 'estudiante'
                        CHECK (rol_global IN ('superadmin', 'staff', 'auditor', 'estudiante')),
    -- Tipo de suscripción del consumidor
    tipo_suscripcion VARCHAR(20) NOT NULL DEFAULT 'base'
                        CHECK (tipo_suscripcion IN ('base', 'vip', 'premium')),
    -- Gamificación — XP total acumulado en la plataforma
    xp_total        BIGINT      NOT NULL DEFAULT 0,
    -- FK al nivel global actual del usuario
    nivel_id        UUID        REFERENCES niveles_globales(id) ON DELETE SET NULL,
    -- Control de acceso
    esta_activo     BOOLEAN     NOT NULL DEFAULT TRUE,
    email_verificado BOOLEAN    NOT NULL DEFAULT FALSE,
    ultimo_login    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE usuarios IS 'Registro centralizado de usuarios. Un mismo usuario puede tener múltiples roles según el contexto de academia.';
COMMENT ON COLUMN usuarios.rol_global IS 'Rol de plataforma (SuperAdmin tiene control total; Staff modera a nivel global). Los roles contextuales se definen en roles_contextuales.';
COMMENT ON COLUMN usuarios.password_hash IS 'Hash bcrypt de la contraseña. Nunca almacenar texto plano.';

-- ============================================================
-- SECCIÓN 2: MULTI-TENANT — Academias y Roles Contextuales
-- ============================================================

-- Tabla: academias
-- Cada academia es un "tenant" aislado gestionado por un Creador (Owner)
CREATE TABLE IF NOT EXISTS academias (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    -- FK al usuario propietario principal de la academia (Creador/Owner)
    owner_id        UUID        NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    nombre          VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) NOT NULL UNIQUE, -- URL amigable: yourcourse.com/academia/mi-academia
    descripcion     TEXT,
    logo_url        TEXT,
    banner_url      TEXT,
    -- Configuración de comisión que cobra la plataforma al creador
    porcentaje_comision NUMERIC(5,2) NOT NULL DEFAULT 10.00
                        CHECK (porcentaje_comision >= 0 AND porcentaje_comision <= 100),
    esta_activa     BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE academias IS 'Cada academia es un tenant aislado. El campo owner_id referencia al Creador principal responsable.';
COMMENT ON COLUMN academias.owner_id IS 'FK al usuario que creó y controla la academia. Este usuario tiene rol implícito de Owner en su academia.';

-- Tabla: roles_contextuales
-- Tabla puente que asigna roles específicos a usuarios dentro de una academia concreta.
-- Garantiza el aislamiento de datos: los permisos de un usuario en Academia A NO se transfieren a Academia B.
CREATE TABLE IF NOT EXISTS roles_contextuales (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    -- FK al usuario que recibe el rol contextual
    usuario_id  UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    -- FK a la academia donde aplica el rol (aislamiento de datos entre academias)
    academia_id UUID        NOT NULL REFERENCES academias(id) ON DELETE CASCADE,
    -- Rol dentro de esta academia específica
    rol         VARCHAR(50) NOT NULL
                    CHECK (rol IN ('owner', 'editor', 'moderador', 'estudiante')),
    asignado_por UUID        REFERENCES usuarios(id) ON DELETE SET NULL, -- Quién asignó el rol
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Un usuario solo puede tener un rol por academia
    CONSTRAINT uq_usuario_academia UNIQUE (usuario_id, academia_id)
);

COMMENT ON TABLE roles_contextuales IS 'Tabla puente RBAC contextual. Los permisos son por academia: tener rol "editor" en Academia A NO otorga acceso a Academia B. Esto garantiza el aislamiento multi-tenant.';
COMMENT ON COLUMN roles_contextuales.academia_id IS 'FK a la academia que delimita el alcance del rol. El aislamiento de datos se refuerza filtrando siempre por este campo en las consultas.';
COMMENT ON COLUMN roles_contextuales.usuario_id IS 'FK al usuario que posee el rol. Al eliminar el usuario, se eliminan en cascada todos sus roles contextuales.';

-- ============================================================
-- SECCIÓN 3: CONTENIDO — Cursos, Módulos y Lecciones
-- ============================================================

-- Tabla: cursos
CREATE TABLE IF NOT EXISTS cursos (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    -- FK a la academia propietaria (aislamiento: los cursos pertenecen a una academia específica)
    academia_id     UUID        NOT NULL REFERENCES academias(id) ON DELETE CASCADE,
    titulo          VARCHAR(500) NOT NULL,
    slug            VARCHAR(500) NOT NULL,
    descripcion     TEXT,
    thumbnail_url   TEXT,
    -- Modelo de negocio del curso
    modelo_negocio  VARCHAR(30) NOT NULL DEFAULT 'gratis'
                        CHECK (modelo_negocio IN ('gratis', 'pago_unico', 'suscripcion')),
    precio          NUMERIC(10,2) DEFAULT 0.00
                        CHECK (precio >= 0),
    moneda          CHAR(3)     NOT NULL DEFAULT 'MXN',
    -- Estado del curso
    estado          VARCHAR(20) NOT NULL DEFAULT 'borrador'
                        CHECK (estado IN ('borrador', 'publicado', 'archivado')),
    es_destacado    BOOLEAN     NOT NULL DEFAULT FALSE,
    -- XP que otorga completar el curso completo (bonus)
    xp_completar    INT         NOT NULL DEFAULT 100,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_curso_slug_academia UNIQUE (academia_id, slug)
);

COMMENT ON TABLE cursos IS 'Cursos de una academia. El campo academia_id asegura que los cursos queden aislados por tenant.';
COMMENT ON COLUMN cursos.academia_id IS 'FK a la academia. Las consultas deben filtrar siempre por academia_id para mantener el aislamiento multi-tenant.';

-- Tabla: modulos
-- Agrupaciones de lecciones dentro de un curso (capítulos)
CREATE TABLE IF NOT EXISTS modulos (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    -- FK al curso al que pertenece el módulo
    curso_id    UUID        NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    titulo      VARCHAR(500) NOT NULL,
    descripcion TEXT,
    orden       INT         NOT NULL DEFAULT 0, -- Posición del módulo dentro del curso
    esta_publicado BOOLEAN  NOT NULL DEFAULT FALSE,
    -- XP que otorga completar todas las lecciones del módulo
    xp_completar INT        NOT NULL DEFAULT 25,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE modulos IS 'Módulos (capítulos) que agrupan lecciones dentro de un curso. Ordenados por el campo "orden".';
COMMENT ON COLUMN modulos.curso_id IS 'FK al curso padre. Al eliminar un curso, se eliminan en cascada sus módulos y lecciones.';

-- Tabla: lecciones
-- Unidad mínima de contenido (un video, un artículo, etc.)
CREATE TABLE IF NOT EXISTS lecciones (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    -- FK al módulo al que pertenece la lección
    modulo_id       UUID        NOT NULL REFERENCES modulos(id) ON DELETE CASCADE,
    titulo          VARCHAR(500) NOT NULL,
    descripcion     TEXT,
    orden           INT         NOT NULL DEFAULT 0,
    tipo            VARCHAR(20) NOT NULL DEFAULT 'video'
                        CHECK (tipo IN ('video', 'articulo', 'quiz', 'archivo')),
    -- URL de video embebido (YouTube No Listado, Vimeo) para no saturar el servidor
    video_url       TEXT,
    duracion_segundos INT,
    -- XP otorgado al completar esta lección
    xp_completar    INT         NOT NULL DEFAULT 10,
    esta_publicada  BOOLEAN     NOT NULL DEFAULT FALSE,
    es_preview      BOOLEAN     NOT NULL DEFAULT FALSE, -- Vista previa gratuita
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE lecciones IS 'Unidad mínima de contenido. video_url almacena enlaces embebidos (YouTube/Vimeo) para no saturar el servidor local.';
COMMENT ON COLUMN lecciones.modulo_id IS 'FK al módulo padre. Al eliminar un módulo, se eliminan en cascada sus lecciones.';

-- Tabla: progreso_lecciones
-- Registra qué lecciones ha completado cada estudiante
CREATE TABLE IF NOT EXISTS progreso_lecciones (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id      UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    leccion_id      UUID        NOT NULL REFERENCES lecciones(id) ON DELETE CASCADE,
    completada      BOOLEAN     NOT NULL DEFAULT FALSE,
    completada_en   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_progreso_usuario_leccion UNIQUE (usuario_id, leccion_id)
);

-- ============================================================
-- SECCIÓN 4: GAMIFICACIÓN — Registro XP y Niveles
-- ============================================================

-- Tabla: registro_xp
-- Log inmutable de todas las transacciones de XP del usuario (auditoría completa)
CREATE TABLE IF NOT EXISTS registro_xp (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    -- FK al usuario que recibe el XP
    usuario_id  UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    -- FK a la academia en cuyo contexto se generó el XP (permite analytics por academia)
    academia_id UUID        REFERENCES academias(id) ON DELETE SET NULL,
    -- Tipo de acción que generó el XP
    accion      VARCHAR(50) NOT NULL
                    CHECK (accion IN (
                        'LOGIN_DIARIO',
                        'LECCION_COMPLETADA',
                        'MODULO_COMPLETADO',
                        'CURSO_COMPLETADO',
                        'PARTICIPACION_FORO',
                        'RESPUESTA_UTIL',
                        'BONUS_ADMIN'
                    )),
    xp_otorgado INT         NOT NULL CHECK (xp_otorgado > 0),
    -- Referencia opcional al recurso que generó el XP
    referencia_id UUID,       -- ID de la lección, módulo o curso
    referencia_tipo VARCHAR(30), -- 'leccion', 'modulo', 'curso', 'foro'
    metadatos   JSONB,        -- Datos adicionales del evento (ej. nivel alcanzado)
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE registro_xp IS 'Log inmutable de eventos de XP. Cada fila es una transacción de puntos. Nunca se eliminan ni actualizan registros.';
COMMENT ON COLUMN registro_xp.usuario_id IS 'FK al usuario beneficiario del XP. Al eliminar usuario, se eliminan su historial en cascada.';
COMMENT ON COLUMN registro_xp.academia_id IS 'FK a la academia donde ocurrió el evento. Permite segmentar el XP por contexto de academia.';

-- ============================================================
-- ÍNDICES — Optimización de consultas frecuentes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_academias_slug ON academias(slug);
CREATE INDEX IF NOT EXISTS idx_academias_owner ON academias(owner_id);
CREATE INDEX IF NOT EXISTS idx_roles_contextuales_usuario ON roles_contextuales(usuario_id);
CREATE INDEX IF NOT EXISTS idx_roles_contextuales_academia ON roles_contextuales(academia_id);
CREATE INDEX IF NOT EXISTS idx_cursos_academia ON cursos(academia_id);
CREATE INDEX IF NOT EXISTS idx_modulos_curso ON modulos(curso_id);
CREATE INDEX IF NOT EXISTS idx_lecciones_modulo ON lecciones(modulo_id);
CREATE INDEX IF NOT EXISTS idx_registro_xp_usuario ON registro_xp(usuario_id);
CREATE INDEX IF NOT EXISTS idx_registro_xp_academia ON registro_xp(academia_id);
CREATE INDEX IF NOT EXISTS idx_progreso_usuario ON progreso_lecciones(usuario_id);

-- ============================================================
-- DATOS INICIALES — Niveles globales de la plataforma
-- ============================================================

INSERT INTO niveles_globales (nombre, xp_requerido, nivel_orden, descripcion) VALUES
    ('Caminante',   0,      1, 'Nivel inicial. Acceso básico a la plataforma.'),
    ('Explorador',  500,    2, 'Has completado tus primeras lecciones. Se desbloquean los foros.'),
    ('Aprendiz',    1500,   3, 'Participación activa en la comunidad.'),
    ('Erudito',     4000,   4, 'Conocimiento avanzado. Acceso a contenido exclusivo.'),
    ('Maestro',     10000,  5, 'Dominio experto. Insignia especial en el perfil público.'),
    ('Leyenda',     25000,  6, 'Nivel máximo. Reconocimiento élite en la plataforma.')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- TRIGGER — Actualizar updated_at automáticamente
-- ============================================================

CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con updated_at
DO $$
DECLARE
    tablas TEXT[] := ARRAY['usuarios', 'academias', 'roles_contextuales', 'cursos', 'modulos', 'lecciones', 'niveles_globales'];
    t TEXT;
BEGIN
    FOREACH t IN ARRAY tablas LOOP
        EXECUTE format('
            CREATE OR REPLACE TRIGGER trg_%s_updated_at
            BEFORE UPDATE ON %s
            FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
        ', t, t);
    END LOOP;
END $$;
