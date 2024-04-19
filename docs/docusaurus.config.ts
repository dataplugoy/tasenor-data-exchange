import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Tasenor Data Exchange',
  tagline: 'Documentation',
  favicon: 'favicon.ico',

  // Set the production url of your site here
  url: 'https://data-exchange.tasenor.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'dataplugoy',
  projectName: 'tasenor-data-exchange',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  staticDirectories: ['public'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [],

  themes: ['@docusaurus/theme-mermaid'],

  markdown: {
    mermaid: true,
  },

  themeConfig: {
    image: 'logo.png',
    navbar: {
      title: 'Tasenor Data Exchange',
      items: process.env.NODE_ENV === 'dev' ? [
        {
          type: 'docSidebar',
          sidebarId: 'docSidebarId',
          position: 'left',
          label: 'Documentation',
        },
      ]: []
    },

    footer: {
      style: 'dark',
      links: [
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Dataplug Oy`,
    },

    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },

  } satisfies Preset.ThemeConfig,
};

export default config;
