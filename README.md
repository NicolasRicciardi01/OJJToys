# ASCII Studio Pro - Editor de Imágenes Retro & ASCII

Una aplicación web moderna para transformar imágenes a arte ASCII, mosaicos de píxeles y semitonos de círculos (halftone) con control de grilla interactivo, paletas retro y exportación en resolución nativa.

## 🚀 Características

1. **Carga de Imágenes de hasta 2K+**:
   - Soporte para `.jpg`, `.jpeg`, `.png` y `.webp`.
   - **Soporte completo de transparencia PNG**: Detecta el canal alfa y permite mantener la transparencia o aplicar fondos.
   - **Opciones de Fondo**: Transparente (ajedrez retro), Negro, Blanco, Selector de color personalizado o **subir una imagen de fondo propia**.

2. **Control Dinámico de Grilla (2x2 a 256x256)**:
   - Slider de precisión para alterar la resolución de la cuadrícula.
   - **Desvanecimiento automático**: Al ajustar el slider, la cuadrícula se dibuja sobre la imagen en tiempo real y **se desvanece suavemente tras 1 segundo de inactividad**.
   - Opción para mantener la proporción de aspecto original de la imagen o cuadrícula 1:1.

3. **Gamas de Color**:
   - **Blanco y Vacío**: Monocromo binario de alto contraste.
   - **Escala de Grises**: Degradado suave de luminancia.
   - **Game Boy**: La icónica paleta verdosa de 4 tonos (Nintendo DMG-01).
   - **Flúor / Neón**: Paleta cyberpunk vibrante (magenta, cian, lima, amarillo).
   - **Matrix Terminal**: Fósforo verde terminal hacker.
   - **Ámbar CRT**: Pantallas de tubo vintage de fósforo ámbar.
   - **Color Original**: Mantiene los colores RGB originales de la imagen.
   - Opción de invertir polaridad (negativo).
   - Controles de brillo y contraste fino.

4. **Modos de Relleno**:
   - **Relleno Gradual de Píxel**: Bloques geométricos escalados según el nivel de luz.
   - **Símbolos ASCII**: Caracteres tipográficos con soporte para varios juegos (Estándar, Bloques █▓▒░, Binario 10, Minimalista, Detallado y Caracteres Personalizados).
   - **Círculos (Halftone / Dot Matrix)**: Círculos con radio proporcional al brillo de cada celda.

5. **Visor Interactivo**:
   - Zoom con rueda del ratón y botones flotantes (+ / - / Ajustar a pantalla).
   - Desplazamiento (Pan) arrastrando el ratón cuando se hace zoom.

6. **Exportación en Resolución Nativa**:
   - Genera y descarga la imagen en las dimensiones originales exactas de la imagen cargada (ej. 1920x1080, 2048x2048, etc.) con máxima fidelidad.
   - Descarga en formato PNG (conserva transparencia) o JPG.
   - Botón adicional para copiar el arte ASCII generado como texto plano al portapapeles.

## 💻 Cómo Usar

Simplemente abre el archivo `index.html` en cualquier navegador web moderno (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari, etc.). No requiere instalación ni servidores externos.

