import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'PostViajes — Flyer a Post en segundos'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Círculos decorativos de fondo */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'rgba(14, 165, 233, 0.15)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', bottom: '-100px', left: '-60px',
          width: '350px', height: '350px', borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.12)',
          display: 'flex',
        }} />

        {/* Línea decorativa superior */}
        <div style={{
          position: 'absolute', top: '0', left: '0', right: '0',
          height: '5px',
          background: 'linear-gradient(90deg, #0ea5e9, #6366f1, #0ea5e9)',
          display: 'flex',
        }} />

        {/* Emojis flotantes */}
        <div style={{
          position: 'absolute', top: '60px', left: '80px',
          fontSize: '52px', opacity: 0.25, display: 'flex',
        }}>✈️</div>
        <div style={{
          position: 'absolute', top: '80px', right: '100px',
          fontSize: '48px', opacity: 0.2, display: 'flex',
        }}>🌴</div>
        <div style={{
          position: 'absolute', bottom: '80px', left: '100px',
          fontSize: '44px', opacity: 0.2, display: 'flex',
        }}>🏖️</div>
        <div style={{
          position: 'absolute', bottom: '60px', right: '80px',
          fontSize: '50px', opacity: 0.22, display: 'flex',
        }}>🗺️</div>

        {/* Logo / Nombre */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0px',
        }}>
          {/* Ícono */}
          <div style={{
            width: '90px', height: '90px', borderRadius: '24px',
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '28px',
            boxShadow: '0 8px 32px rgba(14,165,233,0.4)',
          }}>
            <span style={{ fontSize: '48px' }}>✈️</span>
          </div>

          {/* Nombre */}
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '0px',
          }}>
            <span style={{
              fontSize: '96px',
              fontWeight: 900,
              color: 'white',
              letterSpacing: '-3px',
              lineHeight: 1,
            }}>Post</span>
            <span style={{
              fontSize: '96px',
              fontWeight: 900,
              color: '#0ea5e9',
              letterSpacing: '-3px',
              lineHeight: 1,
            }}>Viajes</span>
          </div>

          {/* Tagline */}
          <div style={{
            fontSize: '30px',
            color: 'rgba(255,255,255,0.65)',
            marginTop: '16px',
            letterSpacing: '1px',
            fontWeight: 400,
          }}>
            Flyer a Post en segundos · Para agencias de viajes
          </div>

          {/* Badges */}
          <div style={{
            display: 'flex',
            gap: '16px',
            marginTop: '40px',
          }}>
            {['✈️ Turismo', '🏖️ Destinos', '🤖 IA', '📲 Redes'].map(badge => (
              <div key={badge} style={{
                padding: '10px 20px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '22px',
                fontWeight: 500,
                display: 'flex',
              }}>
                {badge}
              </div>
            ))}
          </div>
        </div>

        {/* URL abajo */}
        <div style={{
          position: 'absolute', bottom: '32px',
          fontSize: '22px', color: 'rgba(255,255,255,0.35)',
          letterSpacing: '2px',
          display: 'flex',
        }}>
          postviajes.com.ar
        </div>
      </div>
    ),
    { ...size }
  )
}
