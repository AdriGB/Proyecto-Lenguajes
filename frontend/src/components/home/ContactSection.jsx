import React from 'react'
import { Send, Mail, MapPin, Clock, Shield } from 'lucide-react'
import Card from '../Card'
import Badge from '../Badge'
import Button from '../Button'
import Input from '../Input'
import Textarea from '../Textarea'
import Alert from '../Alert'

/**
 * ContactSection Component
 * Renders the direct contact form and support information cards.
 */
export default function ContactSection({
  user,
  isAuthenticated = false,
  formData,
  formErrors,
  submitting,
  submitFeedback,
  setSubmitFeedback,
  handleInputChange,
  handleContactSubmit,
}) {
  return (
    <section id="contacto" className="py-20 bg-zinc-900/20">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="neutral" size="sm" className="mb-3">
            Contacto Directo
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Formulario de Contacto
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
            Envía tu consulta, propuesta técnica o solicitud académica. Las consultas son procesadas
            en SQLite y atendidas por nuestro operador.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Column */}
          <div className="lg:col-span-7">
            <Card padding="lg">
              <Card.Header>
                <Card.Title className="text-xl font-bold text-white">
                  Enviar un Mensaje
                </Card.Title>
                <Card.Description>
                  {isAuthenticated
                    ? `Has iniciado sesión como ${user?.name} (${user?.email}). Tu ID de usuario se vinculará a la consulta automáticamente.`
                    : 'Puedes enviar tu consulta como visitante. Si ya tienes cuenta, tus datos se vincularán automáticamente al iniciar sesión.'}
                </Card.Description>
              </Card.Header>

              {submitFeedback && (
                <div className="mb-6">
                  <Alert
                    variant={submitFeedback.type}
                    onClose={() => setSubmitFeedback(null)}
                    title={submitFeedback.type === 'success' ? 'Mensaje Enviado' : 'Error al Enviar'}
                  >
                    {submitFeedback.message}
                  </Alert>
                </div>
              )}

              <form onSubmit={handleContactSubmit} className="space-y-5" noValidate>
                {/* Name field */}
                <Input
                  label="Nombre Completo"
                  id="contact-name"
                  name="name"
                  placeholder="Tu nombre o institución"
                  required={true}
                  value={formData.name}
                  onChange={handleInputChange}
                  error={formErrors.name}
                  disabled={submitting}
                />

                {/* Email field */}
                <Input
                  label="Correo Electrónico"
                  id="contact-email"
                  name="email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  required={true}
                  value={formData.email}
                  onChange={handleInputChange}
                  error={formErrors.email}
                  disabled={submitting}
                />

                {/* Inquiry Type field */}
                <div className="w-full space-y-1.5">
                  <label
                    htmlFor="contact-inquiry-type"
                    className="block text-xs font-semibold uppercase tracking-wider text-zinc-400"
                  >
                    Tipo de Consulta <span className="text-sky-400">*</span>
                  </label>
                  <select
                    id="contact-inquiry-type"
                    name="inquiry_type"
                    value={formData.inquiry_type}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3.5 py-2.5 text-sm transition-colors duration-200 focus:outline-none focus:ring-1 focus:border-sky-500 focus:ring-sky-500 disabled:opacity-50 cursor-pointer"
                  >
                    <option value="Desarrollo Web / Solución Fullstack">
                      Desarrollo Web / Solución Fullstack
                    </option>
                    <option value="Consultoría Técnica & Arquitectura">
                      Consultoría Técnica &amp; Arquitectura
                    </option>
                    <option value="Propuesta Académica / Evaluación">
                      Propuesta Académica / Evaluación
                    </option>
                    <option value="Soporte & Mantenimiento">Soporte &amp; Mantenimiento</option>
                    <option value="Otro motivo">Otro motivo</option>
                  </select>
                  {formErrors.inquiry_type && (
                    <p className="text-xs text-rose-400 mt-1" role="alert">
                      {formErrors.inquiry_type}
                    </p>
                  )}
                </div>

                {/* Message field */}
                <Textarea
                  label="Mensaje"
                  id="contact-message"
                  name="message"
                  rows={5}
                  placeholder="Describe en detalle tu consulta o propuesta..."
                  required={true}
                  value={formData.message}
                  onChange={handleInputChange}
                  error={formErrors.message}
                  disabled={submitting}
                />

                {/* Submit Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={submitting}
                    rightIcon={<Send className="w-4 h-4" />}
                    className="w-full sm:w-auto"
                  >
                    {submitting ? 'Enviando consulta...' : 'Enviar Consulta'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Contact Info Side Card */}
          <div className="lg:col-span-5 space-y-6">
            <Card padding="lg">
              <Card.Header>
                <Card.Title className="text-lg font-bold text-white">
                  Información de Contacto
                </Card.Title>
                <Card.Description>
                  Canales de comunicación directa para la revisión del proyecto.
                </Card.Description>
              </Card.Header>
              <Card.Content className="space-y-5">
                <div className="flex items-start space-x-3 text-sm">
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sky-400 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs text-zinc-400 font-medium">Correo Electrónico</span>
                    <a
                      href="mailto:contacto@portfolio.local"
                      className="text-white hover:text-sky-400 font-semibold transition-colors duration-200"
                    >
                      contacto@portfolio.local
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-sm">
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-violet-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs text-zinc-400 font-medium">Entorno de Demostración</span>
                    <span className="text-white font-semibold">Localhost (HTTP :5000 / :5173)</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-sm">
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs text-zinc-400 font-medium">Atención del Operador</span>
                    <span className="text-white font-semibold">Respuesta inmediata &bull; Panel activo</span>
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Security & Academic Notice */}
            <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 space-y-3">
              <div className="flex items-center space-x-2 text-white font-semibold">
                <Shield className="w-4 h-4 text-sky-400" />
                <span>Garantía de Privacidad Local</span>
              </div>
              <p className="leading-relaxed">
                Las consultas enviadas se almacenan localmente en la base de datos SQLite
                (<code className="text-sky-400 font-mono">contact_messages</code>). Los operadores y
                administradores autorizados gestionan las respuestas mediante el servicio integrado de correo
                (Nodemailer).
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
