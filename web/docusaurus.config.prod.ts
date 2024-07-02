import config from './docusaurus.config'

config.headTags = [
  {
    tagName: 'link',
    attributes: {
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com',
    },
  },
  {
    tagName: 'link',
    attributes: {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&family=Red+Hat+Display:ital@0;1&display=swap',
    },
  },
  {
    tagName: 'link',
    attributes: {
      rel: 'preconnect',
      href: 'https://www.google-analytics.com',
    },
  },
  {
    tagName: 'link',
    attributes: {
      rel: 'preconnect',
      href: 'https://www.googletagmanager.com',
    },
  },
  // https://developers.google.com/analytics/devguides/collection/gtagjs/#install_the_global_site_tag
  {
    tagName: 'script',
    attributes: {
      src: `https://www.googletagmanager.com/gtag/js?id=G-GL9P9RSCVH`,
    },
  },
  {
    tagName: 'script',
    attributes: {},
    innerHTML: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-GL9P9RSCVH');
      `,
  },
]

console.log('Production config:')
console.dir(config, {depth: null})

export default config;
