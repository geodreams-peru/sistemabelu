# 🗄️ Reglas de Base de Datos — BELÚ SYSTEM

> **DOCUMENTO OBLIGATORIO** — Todo desarrollador y agente de IA debe leer y respetar estas reglas antes de hacer cualquier cambio en el sistema.

---

## 🔴 Regla Principal

**EL CÓDIGO NUNCA DEBE MODIFICAR EL ESQUEMA DE LA BASE DE DATOS EN PRODUCCIÓN.**

Esto incluye:
- ❌ `CREATE TABLE` (crear tablas nuevas)
- ❌ `ALTER TABLE ADD COLUMN` (agregar columnas)
- ❌ `ALTER TABLE DROP COLUMN` (eliminar columnas)
- ❌ `DROP TABLE` (eliminar tablas)
- ❌ `CREATE INDEX` (crear índices)
- ❌ Crear archivos `.db` nuevos vacíos

Las operaciones normales de datos (INSERT, UPDATE, DELETE) **SÍ están permitidas** — son la operación normal de la aplicación.

---

## 📋 Bases de Datos del Sistema

| Archivo | Módulo | Ubicación en producción |
|---------|--------|------------------------|
| `asistencia.db` | Asistencia / Embajadores | `$DATA_DIR/asistencia.db` |
| `compras.db` | Compras | `$DATA_DIR/compras.db` |
| `contabilidad.db` | Contabilidad | `$DATA_DIR/contabilidad.db` |
| `errores.db` | Errores / Incidencias | `$DATA_DIR/errores.db` |
| `evolucion.db` | Evolución | `$DATA_DIR/evolucion.db` |
| `movimientos.db` | Movimientos DKP | `$DATA_DIR/movimientos.db` |

---

## 🛡️ Cómo Funciona la Protección

### En Producción (`NODE_ENV=production`)

1. **`lib/db.js → openDatabase()`**: Abre bases de datos en modo `OPEN_READWRITE` (sin `OPEN_CREATE`). Si el archivo `.db` no existe o está vacío, el servidor se detiene inmediatamente con un error claro.

2. **`lib/db.js → shouldMigrate()`**: Retorna `false` en producción. Todo el código de `CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX` está envuelto en `if (shouldMigrate())` y se salta completamente.

### En Desarrollo (`NODE_ENV=development` o no definido)

1. **`openDatabase()`**: Comportamiento normal — crea el archivo si no existe.
2. **`shouldMigrate()`**: Retorna `true` — ejecuta todas las migraciones de esquema.

---

## 🔄 Procedimiento para Cambios de Esquema

Cuando se necesite agregar una columna, crear una tabla, o cualquier cambio de esquema:

### Paso 1: Notificar
El desarrollador/agente **debe avisar al administrador** antes de hacer el cambio. No se despliega automáticamente.

### Paso 2: Script SQL Manual
Preparar el SQL necesario. Ejemplo:
```sql
-- Agregar columna 'nueva_columna' a la tabla 'empleados'
ALTER TABLE empleados ADD COLUMN nueva_columna TEXT DEFAULT '';
```

### Paso 3: Ejecutar en el Servidor
El administrador ejecuta el SQL **directamente en la base de datos del servidor** (vía terminal SSH, phpLiteAdmin, o herramienta similar).

### Paso 4: Actualizar el Código
Después de confirmar que el cambio fue aplicado en producción, se actualiza el código que usa la nueva columna y se hace deploy.

### Paso 5: Documentar
Registrar el cambio en la sección "Historial de Cambios de Esquema" de este documento.

---

## ⚙️ Configuración de Hostinger

### Variables de Entorno Requeridas
```
NODE_ENV=production
DATA_DIR=/home/uXXXX/domains/tudominio.com/nodejs/data
UPLOADS_DIR=/home/uXXXX/domains/tudominio.com/nodejs/uploads
SESSION_SECRET=un_secreto_largo_y_seguro
```

> ⚠️ `DATA_DIR` y `UPLOADS_DIR` DEBEN apuntar a carpetas **persistentes** fuera del directorio de deploy. Si no se configuran, el sistema usa `./data/` relativo al proyecto, que se borra en cada redeploy.

---

## 📜 Historial de Cambios de Esquema

| Fecha | Base de Datos | Cambio | SQL | Estado |
|-------|--------------|--------|-----|--------|
| (ejemplo) | asistencia.db | Agregar columna X | `ALTER TABLE empleados ADD COLUMN x TEXT` | ✅ Aplicado |

---

## 🚨 Qué Hacer si se Pierden Datos

1. **No hacer redeploy** — puede empeorar la situación.
2. Verificar si el sistema de correos de respaldo envió copias (se envían diariamente si está activo).
3. Revisar snapshots/backups de Hostinger.
4. Contactar al administrador del sistema.
