/**
 * Helpers para correos electrónicos de Mi Pana
 */

function emailTemplate({ title, preheader, content, ctaText, ctaUrl }) {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#E8E8F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
    <span style="display:none;max-height:0;overflow:hidden">${preheader}</span>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#E8E8F0;padding:40px 16px">
      <tr><td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
          <tr>
            <td style="background:#FFC200;background:linear-gradient(160deg, #FFC200 0%, #F8E22A 60%);border-radius:20px 20px 0 0;padding:36px 40px;text-align:center">
              <img src="https://mipana.net/icons/logo-splash.png"
                alt="Mi Pana" width="182"
                style="display:block;margin:0 auto;max-width:182px"/>
            </td>
          </tr>
          <tr>
            <td style="background:#FFFFFF;padding:40px 40px 32px;border-left:1px solid #EBEBEB;border-right:1px solid #EBEBEB">
              ${content}
              ${ctaText && ctaUrl ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px">
                <tr><td align="center">
                  <a href="${ctaUrl}"
                    style="display:inline-block;background:#FFB400;color:#1A1A3A;font-weight:900;font-size:16px;padding:16px 40px;border-radius:14px;text-decoration:none;letter-spacing:0.3px">
                    ${ctaText}
                  </a>
                </td></tr>
              </table>` : ''}
            </td>
          </tr>
          <tr>
            <td style="background:#F5F5F8;border-radius:0 0 20px 20px;padding:24px 40px;text-align:center;border:1px solid #EBEBEB;border-top:none">
              <p style="margin:0 0 8px;color:#1A1A3A;opacity:0.4;font-size:12px">
                &copy; 2025 Mi Pana &middot; Juntos somos más
              </p>
              <p style="margin:0;font-size:12px">
                <a href="https://mipana.net/privacidad" style="color:#1A1A3A;opacity:0.4;text-decoration:none">Privacidad</a>
                &nbsp;&middot;&nbsp;
                <a href="https://mipana.net/cookies" style="color:#1A1A3A;opacity:0.4;text-decoration:none">Cookies</a>
                &nbsp;&middot;&nbsp;
                <a href="https://mipana.net/?contacto=true" style="color:#1A1A3A;opacity:0.4;text-decoration:none">Contacto</a>
                &nbsp;&middot;&nbsp;
                <a href="https://mipana.net" style="color:#1A1A3A;opacity:0.4;text-decoration:none">mipana.net</a>
              </p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>`
}

function lucideIcon(name, color = '#1A1A3A', size = 18) {
  return `<img src="https://unpkg.com/lucide-static@latest/icons/${name}.svg" width="${size}" height="${size}" style="vertical-align:middle;display:inline-block;margin-top:-2px" alt="${name}"/>`
}

function bodyText(title, paragraphs) {
  return `
    <div style="text-align:center;">
      <div style="display:inline-block;text-align:left;">
        <h1 style="margin:0;color:#1A1A3A;font-size:26px;font-weight:900;line-height:1.3">${title}</h1>
        <div style="width:40px;height:4px;background:#FFB400;border-radius:2px;margin:12px 0 28px"></div>
      </div>
    </div>
    ${paragraphs.map(p => `<p style="margin:0 0 16px;color:#3A3A5A;font-size:15px;line-height:1.7;text-align:center">${p}</p>`).join('')}
  `
}

module.exports = {
  emailTemplate,
  lucideIcon,
  bodyText
};
