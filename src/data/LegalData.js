export const LegalData = {
  terms: {
    title: 'Condiciones de Contratación',
    content: `CONDICIONES GENERALES DE CONTRATACIÓN – APP MI PANA
Última actualización: 28 de marzo de 2026

1. OBJETO Y ALCANCE DEL SERVICIO

Las presentes Condiciones Generales de Contratación regulan la relación entre Edgar Guevara (en adelante, "El Titular"), con domicilio en Valencia, España, y los usuarios que utilicen la plataforma App Mi Pana para la publicación de anuncios, compraventa de productos o contratación de servicios profesionales.

App Mi Pana funciona exclusivamente como un punto de encuentro e intermediario tecnológico. El Titular no es dueño, no posee, ni vende los productos o servicios listados por los usuarios.

2. MODALIDADES DE PAGO Y RESPONSABILIDAD

La App permite informar sobre diversos métodos de pago para facilitar las transacciones entre la comunidad. El usuario acepta las siguientes condiciones según el método utilizado:

2.1. Pagos mediante Pasarelas Integradas (Stripe / PayPal)

Cuando el pago se realice a través de las herramientas integradas en la App, la transacción estará sujeta a las condiciones y comisiones de dichos proveedores. App Mi Pana no almacena datos de tarjetas de crédito o débito.

2.2. Pagos P2P (Zelle y Binance / Criptoactivos)

App Mi Pana permite que compradores y vendedores acuerden pagos directos mediante Zelle o Binance.

⚠️ ADVERTENCIA DE SEGURIDAD: App Mi Pana NO se hace responsable por el bloqueo, retención o cierre de cuentas bancarias (Zelle) o cuentas en exchanges (Binance) derivados del uso de la plataforma. El uso de estos métodos es bajo exclusiva responsabilidad de los usuarios. Se recomienda realizar transacciones solo con usuarios con identidad verificada dentro de la App.

3. COMISIONES Y TARIFAS

App Mi Pana establece la siguiente estructura de costos para la sostenibilidad de la plataforma:

• Anuncios Básicos: Gratuitos (según límites mensuales establecidos).
• Anuncios Destacados: Bajo tarifa publicada en la sección de "Promociones" de la App.
• Comisión por Venta (si aplica): En transacciones procesadas íntegramente por la App, se aplicará una comisión sobre el precio final, que será descontada al vendedor en el momento del desembolso.

4. GESTIÓN DE DISPUTAS Y RECLAMACIONES

Al ser una plataforma de intermediación, las disputas por productos no entregados o servicios defectuosos deben resolverse directamente entre las partes.

4.1. Procedimiento de Reporte

Si un vendedor no entrega un producto tras recibir el pago, el comprador debe:
1. Notificar a soporte técnico a través de: radarcriollo@gmail.com
2. Aportar pruebas de la transacción y la falta de respuesta.

4.2. Acciones de la App

App Mi Pana se reserva el derecho de:
• Suspender o eliminar definitivamente la cuenta del usuario infractor.
• Colaborar con las autoridades competentes en caso de denuncias por estafa, aportando los datos de identidad obtenidos en el proceso de verificación (KYC).
• Nota: La App no garantiza el reembolso de dinero enviado a través de métodos externos (Zelle/Binance), ya que no tiene control sobre esos fondos.

5. NORMAS DE PUBLICACIÓN

El anunciante garantiza que:
• Posee el derecho legal de vender el producto u ofrecer el servicio.
• La información, fotos y precios son veraces y no inducen a error.
• No publica artículos prohibidos (armas, sustancias ilegales, servicios no autorizados, etc.).

6. LIMITACIÓN DE RESPONSABILIDAD

El Titular no será responsable de:
• Lucro cesante o daños derivados de transacciones fallidas.
• Indisponibilidad técnica de la App por mantenimiento o fallos en Firebase/Google Cloud.
• Errores en las direcciones de billeteras (wallets) proporcionadas por los usuarios para pagos en Binance/USDT.

7. LEY APLICABLE Y JURISDICCIÓN

Para cualquier controversia derivada del uso de App Mi Pana, las partes se someten a la legislación española vigente. La resolución de cualquier conflicto se llevará a cabo ante los Juzgados y Tribunales de la ciudad de Valencia, España, renunciando expresamente a cualquier otro fuero que pudiera corresponderles.`
  },

  privacy: {
    title: 'Políticas de Privacidad',
    content: `POLÍTICA DE PRIVACIDAD – APP MI PANA
Última actualización: abril 2025

I. CONDICIONES GENERALES DE USO
1. IDENTIFICACIÓN DEL TITULAR
En cumplimiento de la Ley 34/2002 (LSSI-CE), se informa que:

Titular: Edgar Guevara
NIE: Y8580357Z
Domicilio: Valencia, España
Email: radarcriollo@gmail.com
Web: https://mipana.net

La App "Mi Pana" es un marketplace que permite a usuarios de la comunidad venezolana en el exterior publicar anuncios de compraventa de productos y ofrecer servicios profesionales, facilitando el contacto entre compradores y vendedores.

2. CONDICIÓN DE USUARIO
El acceso y uso de la App atribuye la condición de Usuario, implicando la aceptación íntegra de estas condiciones.
El Usuario declara:

Ser mayor de 18 años
Facilitar datos veraces y actualizados
Cumplir la legislación vigente en su país de residencia
Haber leído y aceptado la presente Política de Privacidad

3. REGISTRO Y AUTENTICACIÓN
El Usuario puede registrarse mediante:

Correo electrónico y contraseña
Cuenta de Google (OAuth2)
Cuenta de Facebook (OAuth2)
Número de teléfono mediante código OTP por SMS

Al registrarse por correo electrónico, el Usuario recibirá un código de verificación de 6 dígitos para confirmar la titularidad del email. Dicho código expira a los 15 minutos.
La App utiliza Firebase Authentication (Google LLC) como proveedor de autenticación. Los datos de autenticación se procesan conforme a la Política de Privacidad de Google.

4. VERIFICACIÓN DE IDENTIDAD — SISTEMA "PANA VERIFICADO"
La App ofrece de forma voluntaria y opcional un sistema de verificación de identidad que otorga al Usuario la insignia "Pana Verificado ✓", incrementando su credibilidad ante la comunidad.
4.1 Datos recopilados para la verificación:

Fotografía del documento de identidad (DNI, NIE, Pasaporte, Cédula u otro documento oficial)
Selfie en tiempo real mediante cámara frontal del dispositivo (liveness check)
Puntuación de liveness calculada localmente en el dispositivo

4.2 Proceso de verificación:

El Usuario sube su documentación de forma voluntaria
Las imágenes se almacenan de forma cifrada en Firebase Storage con acceso restringido exclusivamente al equipo de revisión de Mi Pana
Un administrador de Mi Pana revisa la solicitud manualmente en un plazo de 24-48 horas
El Usuario recibe un email con el resultado (aprobado o rechazado con motivo)
Una vez revisada la solicitud, las imágenes son eliminadas permanentemente de los servidores, conservando únicamente el resultado de la verificación en la base de datos

4.3 Conservación de datos de verificación:

Imágenes del documento y selfie: eliminadas inmediatamente tras la revisión (máximo 30 días si no se revisan)
Resultado de la verificación (aprobado/rechazado): conservado durante la vigencia de la cuenta
La verificación tiene una validez de 2 años, tras los cuales puede solicitarse renovación

4.4 Base legal:

Art. 6.1.a RGPD (consentimiento expreso del usuario)
Art. 6.1.f RGPD (interés legítimo: prevención de fraude y estafas)

4.5 Derechos sobre los datos de verificación:
El Usuario puede solicitar la eliminación de su verificación en cualquier momento contactando a radarcriollo@gmail.com. La eliminación de la verificación conlleva la retirada de la insignia "Pana Verificado" de su perfil y anuncios.
4.6 Consecuencias del uso indebido:
Al someterse a la verificación, el Usuario acepta expresamente que, en caso de conductas fraudulentas, estafas o incumplimiento grave de las normas de la comunidad, Mi Pana podrá utilizar los datos de contacto verificados para la resolución de disputas y, si fuera necesario, para la comunicación con autoridades competentes, conforme a la legislación aplicable.

5. COMUNICACIONES POR EMAIL
La App envía comunicaciones automáticas por correo electrónico mediante el servicio Resend (Resend Inc.) en las siguientes situaciones:

Email de bienvenida: al crear una cuenta nueva
Código de verificación: al registrarse para confirmar el email
Recuperación de contraseña: cuando el Usuario solicita restablecer su contraseña
Confirmación de anuncio publicado: al crear un nuevo anuncio
Confirmación de anuncio eliminado: al eliminar un anuncio
Aviso de mensajes sin leer: cuando hay mensajes sin responder en el chat (máximo 1 email por conversación cada 24 horas)
Resultado de verificación de identidad: al aprobar o rechazar una solicitud "Pana Verificado"
Suspensión o eliminación de cuenta: en caso de incumplimiento de normas

El Usuario puede solicitar la baja de comunicaciones no transaccionales contactando a radarcriollo@gmail.com. Los emails transaccionales (seguridad, verificación, recuperación de contraseña) no pueden desactivarse ya que son necesarios para el funcionamiento del servicio.

6. NOTIFICACIONES PUSH
La App puede solicitar permiso para enviar notificaciones push al dispositivo del Usuario mediante Firebase Cloud Messaging (Google LLC).
Las notificaciones push se utilizan para:

Avisar de nuevos mensajes en el chat
Recordatorios de valoración tras un contacto
Comunicaciones de la comunidad y novedades

El Usuario puede:

Aceptar o rechazar el permiso cuando la App lo solicite
Revocar el permiso en cualquier momento desde los ajustes de su dispositivo
Gestionar sus preferencias de notificación desde su perfil en la App

El rechazo de notificaciones push no afecta al uso de las funcionalidades principales de la App.

7. USO DE LA PLATAFORMA
Queda prohibido:

Publicar contenido ilícito, fraudulento o engañoso
Suplantar la identidad de otras personas
Introducir malware o código malicioso
Vulnerar derechos de propiedad intelectual de terceros
Realizar estafas o transacciones fraudulentas
Acosar, amenazar o discriminar a otros usuarios

La App podrá suspender o eliminar cuentas que incumplan estas normas, notificando al Usuario por email con el motivo de la suspensión.

8. PROPIEDAD INTELECTUAL
Todos los contenidos de la App (diseño, código, marca "Mi Pana", logotipo y personaje) son titularidad del propietario o están debidamente licenciados.
El Usuario autoriza el uso no exclusivo, gratuito y limitado de las imágenes y contenidos publicados en sus anuncios, únicamente para la promoción de dichos anuncios dentro de la App y en canales asociados de Mi Pana, durante la vigencia del anuncio.

9. RESPONSABILIDAD
App Mi Pana actúa como intermediario tecnológico. No se responsabiliza de:

La veracidad de los anuncios publicados por los usuarios
La calidad de los productos o servicios ofrecidos
Los acuerdos económicos entre usuarios
Las transacciones realizadas fuera de la plataforma

No obstante, responderá en los casos legalmente exigibles conforme a la normativa aplicable.

II. CONDICIONES DE CONTRATACIÓN Y PAGOS
1. MÉTODOS DE PAGO
La App Mi Pana es una plataforma de contacto. Las transacciones económicas se realizan directamente entre usuarios mediante los métodos que acuerden entre ellos.
⚠️ Advertencia: El uso de métodos de pago externos (transferencias bancarias, Zelle, Bizum, criptomonedas u otros) implica riesgos que el usuario acepta expresamente. La plataforma no será responsable de errores en transferencias, bloqueos de cuentas, ni pérdidas derivadas de acuerdos entre usuarios.

2. SERVICIOS PROFESIONALES
Los profesionales que ofrezcan servicios a través de la App son responsables de cumplir la normativa aplicable en su país de residencia y de disponer de las licencias y habilitaciones necesarias para el ejercicio de su actividad. La App no verifica habilitaciones profesionales.

3. USO DE INTELIGENCIA ARTIFICIAL
La App puede utilizar herramientas de Inteligencia Artificial para la generación de descripciones de anuncios y atención al cliente. El usuario es responsable de revisar y validar los contenidos generados antes de publicarlos.

III. POLÍTICA DE PRIVACIDAD (RGPD)
1. RESPONSABLE DEL TRATAMIENTO
Edgar Guevara
Email: radarcriollo@gmail.com
Web: https://mipana.net

2. DATOS RECOPILADOS

Identificativos: nombre, email, número de teléfono, foto de perfil
Verificación de identidad: fotografía de documento oficial, selfie en tiempo real (eliminados tras revisión)
Contenido generado: anuncios, imágenes de productos, mensajes del chat
Técnicos: dirección IP, tipo de dispositivo, sistema operativo, datos de navegación
Tokens de notificación: identificadores FCM para el envío de notificaciones push

3. FINALIDAD Y BASE LEGAL
FinalidadBase legalGestión de cuenta y autenticaciónEjecución contractual (Art. 6.1.b RGPD)Verificación de identidad (KYC)Consentimiento + Interés legítimo (Art. 6.1.a y 6.1.f RGPD)Envío de emails transaccionalesEjecución contractual (Art. 6.1.b RGPD)Notificaciones pushConsentimiento (Art. 6.1.a RGPD)Prevención de fraudeInterés legítimo (Art. 6.1.f RGPD)Marketing y comunicacionesConsentimiento (Art. 6.1.a RGPD)Mejora del servicio y análisisInterés legítimo (Art. 6.1.f RGPD)

4. DESTINATARIOS
Los datos podrán ser tratados por los siguientes proveedores tecnológicos:

Google Firebase (Google LLC) — autenticación, base de datos, almacenamiento y notificaciones push
Vercel Inc. — alojamiento web y dominio
Resend Inc. — envío de emails transaccionales
Google Analytics — análisis de uso de la App

Todos los proveedores cuentan con garantías adecuadas de protección de datos conforme al RGPD.

5. TRANSFERENCIAS INTERNACIONALES
Algunos proveedores pueden procesar datos fuera del Espacio Económico Europeo (EEE), en particular en Estados Unidos. En estos casos se aplican las garantías adecuadas previstas en el RGPD, incluyendo las Cláusulas Contractuales Tipo aprobadas por la Comisión Europea.

6. CONSERVACIÓN DE DATOS

Datos de cuenta: durante la vigencia de la relación y el tiempo legalmente exigible tras su cancelación
Imágenes de verificación KYC: eliminadas inmediatamente tras la revisión (máximo 30 días)
Resultado de verificación: durante la vigencia de la cuenta
Mensajes del chat: durante la vigencia de la cuenta o hasta su eliminación por el usuario
Tokens FCM: actualizados en cada sesión, eliminados al revocar permisos
Datos bloqueados: conforme a obligaciones legales vigentes

7. DERECHOS DEL USUARIO
El Usuario puede ejercer los siguientes derechos en cualquier momento:

Acceso: conocer qué datos se tratan
Rectificación: corregir datos inexactos
Supresión: solicitar la eliminación de sus datos
Oposición: oponerse al tratamiento en determinados casos
Portabilidad: recibir sus datos en formato estructurado
Limitación: restringir el tratamiento en determinados casos
Retirada del consentimiento: en cualquier momento, sin efecto retroactivo

Para ejercer cualquiera de estos derechos, el Usuario debe enviar una solicitud a: radarcriollo@gmail.com indicando el derecho que desea ejercer y acreditando su identidad.
El Usuario también puede presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD): www.aepd.es

IV. POLÍTICA DE COOKIES
1. TIPOS DE COOKIES

Técnicas (necesarias): imprescindibles para el funcionamiento de la App. No requieren consentimiento.
Analíticas: permiten analizar el uso de la App para su mejora. Requieren consentimiento.
De preferencias: recuerdan las configuraciones del usuario (idioma, localización). Requieren consentimiento.

2. CONSENTIMIENTO
El Usuario podrá aceptar, rechazar o configurar las cookies antes de su instalación mediante el banner de consentimiento que aparece en el primer acceso. Puede modificar su configuración en cualquier momento desde los ajustes de la App.

V. SEGURIDAD
Mi Pana aplica medidas técnicas y organizativas para garantizar la seguridad de los datos personales:

Cifrado de datos en tránsito (HTTPS/TLS)
Almacenamiento cifrado en Firebase Storage y Firestore
Acceso restringido a datos sensibles (documentos de verificación)
Eliminación automática de imágenes tras revisión
Autenticación segura mediante Firebase Authentication
Reglas de seguridad en base de datos y almacenamiento

En caso de brecha de seguridad que afecte a datos personales, Mi Pana notificará a los afectados y a la AEPD en los plazos legalmente establecidos.

VI. JURISDICCIÓN Y LEY APLICABLE
La presente Política se rige por la legislación española y la normativa europea de protección de datos (RGPD — Reglamento UE 2016/679).
En caso de disputas con consumidores, será competente el juzgado del domicilio del usuario. En otros casos, las partes se someten a los juzgados y tribunales de Valencia, España.

VII. ACTUALIZACIONES DE ESTA POLÍTICA
Mi Pana podrá modificar esta Política de Privacidad para adaptarla a cambios legislativos o funcionales de la App. Los usuarios serán notificados por email con al menos 15 días de antelación ante cambios sustanciales. La versión vigente estará siempre disponible en https://mipana.net/privacidad

© 2025 Mi Pana · Juntos somos más 🤝
https://mipana.net · radarcriollo@gmail.com`
  },

  cookies: {
    title: 'Gestión de Cookies',
    content: `📄 POLÍTICA DE COOKIES – APP MI PANA

1. IDENTIFICACIÓN DEL RESPONSABLE

En cumplimiento de la Ley 34/2002 (LSSI-CE):
• Titular: Edgar Guevara
• NIE: Y8580357Z
• Domicilio: Valencia, España
• Email: radarcriollo@gmail.com

2. ¿QUÉ SON LAS COOKIES?

Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando utilizas la App, y que permiten:
• Reconocer tu dispositivo
• Recordar tus preferencias
• Mejorar tu experiencia de usuario
• Analizar el uso de la App

También utilizamos tecnologías similares (SDKs, píxeles, identificadores de dispositivo) incluyendo identificadores de publicidad (IDFA/AAID) y almacenamiento local de Firebase.

3. TIPOS DE COOKIES QUE UTILIZAMOS

3.1. Según su titularidad
• Cookies propias: gestionadas por App Mi Pana
• Cookies de terceros: gestionadas por proveedores externos

3.2. Según su duración
• De sesión: se eliminan al cerrar la App
• Persistentes: permanecen durante un tiempo determinado

3.3. Según su finalidad

✅ Cookies técnicas (necesarias)
Permiten el funcionamiento de la App: inicio de sesión, seguridad, gestión de anuncios, prevención de fraude.
👉 No requieren consentimiento.

📊 Cookies analíticas
Permiten medir y analizar el uso de la App: número de usuarios, secciones más utilizadas, comportamiento de navegación.
👉 Requieren consentimiento.

🎯 Cookies de personalización
Permiten recordar preferencias: idioma, ubicación, configuración de usuario.
👉 Requieren consentimiento (si no son estrictamente necesarias).

📢 Cookies publicitarias
Permiten mostrar publicidad personalizada basada en tu comportamiento: anuncios relevantes, medición de campañas, remarketing.
👉 Requieren consentimiento obligatorio.

4. COOKIES UTILIZADAS EN LA APP

Técnicas:
• Sesión de usuario
• Seguridad (prevención fraude)
• Guardado de preferencias

Analíticas:
• Google Analytics (o similar)

Publicitarias:
• Google Ads
• Meta (Facebook Pixel)
• Otros partners publicitarios

5. CONSENTIMIENTO

Al acceder por primera vez a la App, se mostrará un banner de cookies donde podrás:
• Aceptar todas las cookies
• Rechazarlas
• Configurarlas por categorías

👉 Las cookies no necesarias no se instalarán sin tu consentimiento previo.

6. CONFIGURACIÓN Y ELIMINACIÓN DE COOKIES

Puedes modificar o retirar tu consentimiento en cualquier momento:
• Desde el panel de configuración de cookies de la App
• Desde la configuración de tu navegador o dispositivo

7. COOKIES DE TERCEROS

Esta App puede utilizar servicios de terceros que instalan cookies:
• Google
• Meta (Facebook / Instagram)
• Proveedores de analítica
• Plataformas publicitarias

Estos terceros pueden realizar transferencias internacionales de datos fuera del Espacio Económico Europeo, con garantías adecuadas.

8. ACTUALIZACIONES

La presente Política de Cookies podrá modificarse en función de cambios legales, nuevas cookies o tecnologías, e instrucciones de la AEPD. Se recomienda revisarla periódicamente.

9. MÁS INFORMACIÓN

Para más información sobre el tratamiento de datos personales, consulta nuestra Política de Privacidad.`
  }
};
