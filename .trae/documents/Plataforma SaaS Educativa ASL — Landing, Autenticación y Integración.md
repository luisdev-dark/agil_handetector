## Alcance y Objetivos
- Crear una Landing Page profesional con precios y CTA (login e invitado).
- Implementar autenticación (login/registro) y "Modo invitado" limitado.
- Integrar el flujo con el backend Flask existente redirigiendo al panel actual.
- Mantener diseño responsive, modular y reutilizar estilos existentes.

## Arquitectura Técnica
- **Frontend**: HTML5 + CSS3 (reutiliza `static/css/duolingo-theme.css`, `static/css/animations.css`) + JS ligero para formularios.
- **Backend**: Flask (rutas nuevas para auth y landing), sesiones Flask, almacenamiento inicial SQLite.
- **Estructura**: Nuevas plantillas en `templates/landing/` y `templates/auth/`. Reutilización de header y componentes (btn-duo, card-duo).
- **Diagrama**:
```
Cliente (Landing/Login) → Flask (Auth/Session) → Redirección → Panel actual (index/practice/games)
                       ↘ Pricing (estático)  
```

## Frontend: Landing Page
- **Secciones**:
  - Hero con valor del producto, CTA "Iniciar sesión" y "Modo invitado".
  - Características: bloques tipo card (detección ASL, juegos, progreso, guía visual).
  - Precios: Plan Personal y Plan Enterprise (TBD) con badges y CTA.
  - FAQ/Confianza: seguridad, accesibilidad, soporte.
- **Estilos**: usar `btn-duo`, `card-duo`, utilidades de colores/espaciados; mantener tipografía `Nunito`.
- **Responsiveness**: grid y media queries (ya incluidos en `duolingo-theme.css`).
- **Entrega**: `templates/landing/index.html` y `static/css/landing.css` si se requiere minimal CSS adicional.

## Frontend: Autenticación
- **Pantallas**: `templates/auth/login.html` y `templates/auth/register.html` (formularios simples, validación básica).
- **Modo Invitado**: botón que crea sesión "guest" y restringe funciones avanzadas, mostrando banner informativo.
- **UX**: feedback con clases `badge-duo` y toasts simples; accesible y responsive.

## Backend: Rutas y Sesiones
- **Rutas nuevas**:
  - `GET /landing` (Landing Page, por defecto si no hay sesión).
  - `GET/POST /auth/login` (form + proceso login).
  - `GET/POST /auth/register` (form + alta usuario).
  - `POST /auth/guest` (crear sesión invitado).
  - `POST /auth/logout` (cerrar sesión).
- **Sesiones**:
  - Usa `SECRET_KEY` ya configurado.
  - Estructura de sesión: `{ user_id, role, plan, is_guest }`.
- **Decoradores**:
  - `login_required` opcional para rutas que quieras proteger.
  - `guest_allowed` para permitir acceso a páginas no críticas.
- **Redirecciones**:
  - Tras login/guest: `→ /` (actual `index.html`) o `→ /dashboard` según rol/plan.

## Datos y Persistencia
- **SQLite inicial**: `users` (id, email, password_hash, name, role, plan, created_at).
- **Hashing**: Werkzeug/Passlib para contraseñas.
- **Enterprise (futuro)**: `organizations` y relación usuario-organización.

## Precios y Comercial
- **Página de precios**: componentes con Plan Personal y Enterprise; botones de contacto/CTA (sin cobro aún).
- **TBD**: valores ajustados al mercado LATAM, mostrar "Precio orientativo" y botón "Contáctanos".

## Seguridad y Cumplimiento
- Hash de contraseñas, sesiones seguras (cookies `HttpOnly/Secure` si HTTPS).
- Validación y saneamiento de entradas.
- CSRF para formularios si se usa WTForms/Flask-WTF (opcional en esta fase).

## Integración con Plataforma Actual
- No tocar lógica de detección ni juegos.
- Mostrar header/nav consistente; tras auth/invitado, acceso directo a `index`, `practice`, `games`, `guide` ya existentes.
- Modo invitado: limitar persistencia de progreso local a navegador y bloquear puntos/leaderboard si se desea.

## Diagramas
- **Flujo de Autenticación**:
```
[Landing]
  ├─ Iniciar sesión → /auth/login → sesión → / (index)
  ├─ Registrarse   → /auth/register → sesión → / (index)
  └─ Modo invitado → /auth/guest → sesión {is_guest} → / (index)
```
- **Capas**:
```
UI (HTML/CSS/JS) ↔ Flask Views ↔ Sesión/DB (SQLite) ↔ Rutas existentes (detección/juegos)
```

## Plan de Implementación
- **Fase 1**: Landing Page con Hero, Features, Pricing, CTA (2–3 vistas, responsive).
- **Fase 2**: Login/Registro básico con SQLite y hashing.
- **Fase 3**: Modo invitado y reglas de acceso; redirecciones.
- **Fase 4**: Página de precios completa y pulido UX.
- **Fase 5**: Endurecimiento seguridad; métricas y analítica.

## Criterios de Aceptación
- Landing responsive con secciones solicitadas y navegación clara.
- Login/Registro funcional con sesiones y hashing.
- Modo invitado accede al panel actual con banner y restricciones.
- No se rompe la funcionalidad de detección/juegos existentes.

## Riesgos y Mitigación
- **Persistencia**: comenzar con SQLite; migrar a Postgres en producción.
- **Seguridad**: habilitar HTTPS y cookies seguras en despliegue.
- **Precios**: usar CTA de contacto mientras se define pricing LATAM.

## Siguientes Pasos de Monetización (Posterior)
- Integración con Stripe (Checkout, Webhooks) para suscripciones.
- Gestión de planes y límites (metering) por usuario/organización.
- Panel administrativo para instituciones (Enterprise).