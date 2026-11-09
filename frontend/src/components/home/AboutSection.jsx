import React from 'react'
import {
  Terminal,
  Code2,
  Cpu,
  Database,
  Shield,
  CheckCircle2,
  Activity,
} from 'lucide-react'
import Card from '../Card'
import Badge from '../Badge'

/**
 * AboutSection Component
 * Displays developer profile, core engineering approach, and skills breakdown.
 */
export default function AboutSection() {
  return (
    <section id="sobre-mi" className="py-20 border-b border-zinc-800/60">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="neutral" size="sm" className="mb-3">
            Perfil Profesional
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Sobre mí & Habilidades
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
            Enfoque en desarrollo de software sólido, código limpio y cumplimiento riguroso de
            especificaciones de ingeniería.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Bio Column */}
          <div className="lg:col-span-5 space-y-6">
            <Card padding="lg" className="h-full">
              <Card.Header>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <Card.Title>Ingeniería & Desarrollo Web</Card.Title>
                    <p className="text-xs text-zinc-400">Enfoque Académico & Profesional</p>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <p className="mb-4">
                  Desarrollador fullstack con sólida formación en arquitectura de software desacoplada,
                  sistemas basados en roles y control de acceso seguro. Mi objetivo en este proyecto es
                  demostrar el cumplimiento integral de los requisitos académicos, asegurando interfaces
                  intuitivas y un backend resiliente con cobertura automatizada de pruebas.
                </p>
                <p className="mb-4">
                  Cada componente ha sido diseñado respetando el sistema de diseño Ether,
                  garantizando alto contraste, diseño responsive adaptable y separación estricta de
                  responsabilidades entre capas.
                </p>
                <div className="pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Calidad &amp; Estabilidad:</span>
                  <span className="font-semibold text-emerald-400">100% Tests Aprobados</span>
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Skills Matrix Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Frontend Category */}
              <Card padding="md">
                <div className="flex items-center space-x-2.5 mb-3">
                  <Code2 className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-semibold text-white">Frontend &amp; UI</h3>
                </div>
                <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                  Interfaces dinámicas con renderizado reactivo y tipografía Inter.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['React 18', 'Vite', 'Tailwind CSS', 'React Router v6', 'Lucide React', 'Recharts'].map(
                    (tech) => (
                      <Badge key={tech} variant="tech" size="sm">
                        {tech}
                      </Badge>
                    )
                  )}
                </div>
              </Card>

              {/* Backend Category */}
              <Card padding="md">
                <div className="flex items-center space-x-2.5 mb-3">
                  <Cpu className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-semibold text-white">Backend &amp; APIs</h3>
                </div>
                <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                  APIs RESTful con autenticación por tokens y encriptación bcrypt.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['Node.js 24', 'Express', 'JWT Auth', 'bcryptjs', 'Nodemailer', 'RESTful API'].map(
                    (tech) => (
                      <Badge key={tech} variant="tech" size="sm">
                        {tech}
                      </Badge>
                    )
                  )}
                </div>
              </Card>

              {/* Database Category */}
              <Card padding="md">
                <div className="flex items-center space-x-2.5 mb-3">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">Base de Datos</h3>
                </div>
                <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                  Persistencia relacional en SQLite con integridad referencial.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['SQLite Nativo', 'Claves Foráneas', 'Transacciones', 'Migraciones', 'Seeders'].map(
                    (tech) => (
                      <Badge key={tech} variant="tech" size="sm">
                        {tech}
                      </Badge>
                    )
                  )}
                </div>
              </Card>

              {/* Practices Category */}
              <Card padding="md">
                <div className="flex items-center space-x-2.5 mb-3">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-white">Buenas Prácticas</h3>
                </div>
                <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                  Control de cambios continuo, validación estricta y pruebas unitarias.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['Pruebas node:test', 'RBAC (3 Roles)', 'Changelog Continuo', 'Git', 'Accesibilidad'].map(
                    (tech) => (
                      <Badge key={tech} variant="tech" size="sm">
                        {tech}
                      </Badge>
                    )
                  )}
                </div>
              </Card>
            </div>

            {/* Highlights Strip */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center space-x-2 text-zinc-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Seguridad: RBAC con roles Usuario Normal, Operador y Administrador.</span>
              </div>
              <div className="flex items-center space-x-2 text-zinc-400">
                <Activity className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Monitoreo: Registro atómico de visitas y accesos autenticados.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
