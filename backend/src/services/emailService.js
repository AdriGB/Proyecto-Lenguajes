// backend/src/services/emailService.js
let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch {
  // Graceful fallback if nodemailer is unavailable
}

const config = require('../config');

/**
 * Escapes HTML entities to prevent HTML injection in generated email templates.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validates whether functional SMTP configuration is present.
 */
function isSmtpConfigured() {
  const { host, user, pass } = config.smtp || {};
  if (!host || host === 'dummy' || host.trim() === '') return false;
  if (host !== 'localhost' && (!user || !pass)) return false;
  return true;
}

/**
 * Creates Nodemailer transporter if configured.
 */
function createTransporter() {
  if (!nodemailer || !isSmtpConfigured()) return null;

  const { host, port, user, pass } = config.smtp;
  return nodemailer.createTransport({
    host,
    port: port || 587,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000
  });
}

/**
 * Dispatches an email response to an inquirer.
 * Gracefully degrades to local console logging if SMTP is unconfigured or if network fails.
 * NEVER throws an uncaught exception.
 *
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} [params.name] - Recipient name
 * @param {string} [params.recipientName] - Alias for recipient name
 * @param {string} [params.inquiryType] - Topic / type of inquiry
 * @param {string} [params.originalMessage] - Original inquiry message
 * @param {string} params.responseMessage - Operator's official reply
 * @returns {Promise<{ success: boolean, delivered: boolean, fallback: boolean, messageId?: string, error?: string }>}
 */
async function sendInquiryResponse({
  to,
  name,
  recipientName,
  inquiryType = 'Consulta',
  originalMessage = '',
  responseMessage
}) {
  const clientName = (recipientName || name || 'Estimado/a').trim();

  if (!to || !responseMessage || !responseMessage.trim()) {
    console.warn('[emailService] Parámetros obligatorios faltantes (to o responseMessage).');
    return {
      success: false,
      delivered: false,
      fallback: true,
      error: 'Parámetros obligatorios faltantes (to, responseMessage)'
    };
  }

  const trimmedResponse = responseMessage.trim();
  const subject = `Respuesta a su consulta: ${inquiryType}`;
  const sender = config.smtp?.from || '"Portfolio Soporte" <soporte@portfolio.local>';

  // Text version
  const textBody = [
    `Hola ${clientName},`,
    '',
    'Gracias por ponerse en contacto con nosotros.',
    `En relación a su consulta ("${inquiryType}"):`,
    originalMessage ? `"${originalMessage}"\n` : '',
    'Respuesta del operador:',
    '--------------------------------------------------',
    trimmedResponse,
    '--------------------------------------------------',
    '',
    'Atentamente,',
    'Equipo de Soporte y Operaciones — Portfolio Académico Fullstack'
  ].join('\n');

  // Ether Dark theme HTML template
  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
      <div style="border-bottom: 2px solid #38bdf8; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="color: #38bdf8; margin: 0; font-size: 20px; font-weight: 700;">Respuesta a su consulta</h2>
        <span style="color: #94a3b8; font-size: 13px;">Portfolio Académico Fullstack &bull; Soporte</span>
      </div>
      <p style="font-size: 15px; line-height: 1.5; color: #cbd5e1;">
        Hola <strong>${escapeHtml(clientName)}</strong>,
      </p>
      <p style="font-size: 15px; line-height: 1.5; color: #cbd5e1;">
        Hemos revisado su consulta sobre <em>${escapeHtml(inquiryType)}</em> y le compartimos nuestra respuesta:
      </p>
      <div style="background-color: #1e293b; border-left: 4px solid #38bdf8; padding: 16px 20px; border-radius: 6px; margin: 20px 0;">
        <h4 style="margin: 0 0 8px 0; color: #38bdf8; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Respuesta oficial</h4>
        <p style="margin: 0; color: #f1f5f9; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(trimmedResponse)}</p>
      </div>
      ${originalMessage ? `
      <div style="margin-top: 20px; padding: 14px; background-color: #0b1120; border-radius: 6px; border: 1px solid #1e293b; font-size: 13px; color: #94a3b8;">
        <strong style="color: #64748b; display: block; margin-bottom: 4px;">Su consulta original:</strong>
        <span style="font-style: italic; color: #cbd5e1;">"${escapeHtml(originalMessage)}"</span>
      </div>
      ` : ''}
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #1e293b; text-align: center; font-size: 12px; color: #64748b;">
        <p style="margin: 0;">Este correo fue generado en respuesta a su mensaje de contacto en el portfolio.</p>
        <p style="margin: 4px 0 0 0;">Entorno académico local &bull; Portfolio Fullstack 2026</p>
      </div>
    </div>
  `;

  const transporter = createTransporter();

  // Local fallback if SMTP is unconfigured or dummy
  if (!transporter) {
    console.warn(`[emailService] SMTP no configurado o credenciales dummy. Simulando despacho local para ${to}.`);
    console.log('================== [EMAIL LOCAL SIMULATION] ==================');
    console.log(`Para:    ${to} (${clientName})`);
    console.log(`De:      ${sender}`);
    console.log(`Asunto:  ${subject}`);
    console.log(`Respuesta:\n${trimmedResponse}`);
    console.log('==============================================================');

    return {
      success: true,
      delivered: false,
      fallback: true,
      message: 'Correo registrado y simulado localmente (SMTP no configurado)'
    };
  }

  // Attempt transport delivery
  try {
    const info = await transporter.sendMail({
      from: sender,
      to,
      subject,
      text: textBody,
      html: htmlBody
    });

    console.log(`[emailService] Correo enviado exitosamente a ${to} (MessageID: ${info.messageId})`);
    return {
      success: true,
      delivered: true,
      fallback: false,
      messageId: info.messageId
    };
  } catch (err) {
    console.warn(`[emailService] Error al despachar correo vía SMTP (${err.message}). Registrando mensaje en consola como fallback:`);
    console.log('================== [EMAIL LOCAL FALLBACK] ==================');
    console.log(`Para:    ${to} (${clientName})`);
    console.log(`Asunto:  ${subject}`);
    console.log(`Respuesta:\n${trimmedResponse}`);
    console.log('============================================================');

    return {
      success: true,
      delivered: false,
      fallback: true,
      error: err.message
    };
  }
}

module.exports = {
  sendInquiryResponse,
  sendInquiryReply: sendInquiryResponse, // Export alias for compatibility
  isSmtpConfigured
};
