import type { Config } from 'tailwindcss'

// Paleta propuesta: petróleo (marca), niebla (fondo), tinta (texto), arena (superficies), mostaza (acento puntual).
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        petroleo: { DEFAULT: 'rgb(var(--c-primary) / <alpha-value>)', dark: 'rgb(var(--c-primary-dark) / <alpha-value>)', soft: 'rgb(var(--c-primary-soft) / <alpha-value>)' },
        niebla: '#F3F5F4',
        tinta: '#16232A',
        arena: '#D8D2C4',
        mostaza: 'rgb(var(--c-accent) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
