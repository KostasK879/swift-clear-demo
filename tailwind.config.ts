import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        green: {
          DEFAULT: '#1B3A2D',
          mid: '#2a5a43',
          light: '#3d7a5d',
          faint: '#e8f0ec',
        },
        amber: {
          DEFAULT: '#E08B20',
          dark: '#c07010',
          faint: '#fdf3e3',
        },
        cream: {
          DEFAULT: '#F8F4EE',
          dark: '#EDE8E0',
        },
      },
    },
  },
  plugins: [],
}

export default config
