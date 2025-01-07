const isProduction = process.env.NODE_ENV === 'production'

const config = {
  plugins: { tailwindcss: {} },
}

if (isProduction) {
  config.plugins.autoprefixer = {}
  config.plugins.cssnano = {}
}

export default config
