# Canva Gesture Control

Sistema de control de presentaciones PowerPoint mediante gestos, integrado con Canva.

## Requisitos del Sistema

- **Python 3.8+**
- **Microsoft PowerPoint** (instalado en Windows)
- **Windows OS** (requerido para la integración con PowerPoint)

## Instalación

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd expo
```

### 2. Crear entorno virtual
```bash
python -m venv venv
venv\Scripts\activate
```

### 3. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno
Edita el archivo `.env` con tus credenciales reales de Canva:
```env
CANVA_CLIENT_ID=tu_client_id_real
CANVA_CLIENT_SECRET=tu_client_secret_real
```

### 5. Configurar base de datos
```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Ejecutar el servidor
```bash
python manage.py runserver
```

## Uso

1. Accede a `http://127.0.0.1:8000/`
2. Sube una presentación PowerPoint (.pptx)
3. Usa gestos para controlar la presentación

## Estructura del Proyecto

- `core/` - Aplicación principal Django
- `static/` - Archivos CSS, JS e imágenes
- `templates/` - Plantillas HTML
- `media/` - Archivos subidos (presentaciones y slides)

## Dependencias Principales

- **Django 4.2.7** - Framework web
- **pywin32** - Integración con PowerPoint en Windows
- **Pillow** - Procesamiento de imágenes
- **python-dotenv** - Manejo de variables de entorno