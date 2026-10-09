import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#0A0A12',
        card: '#1D1E2C',
        line: '#2A2B3D',
        accent: '#FF3B57',
        cyan: '#31D8FF',
        gold: '#FFC53D',
        text: '#F4F5FA',
        muted: '#9EA1B8',
        purple: '#A78BFA',
      },
      fontFamily: {
        heading: ['"Baloo 2"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
