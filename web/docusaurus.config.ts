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
    locales: ['en', 'fi'],
    localeConfigs: {
      en: {
        label: 'EN',
        htmlLang: 'en-GB',
      },
      fi: {
        label: 'FI',
        htmlLang: 'fi-FI',
      },
    },
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

  headTags: [
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
  ],

  themeConfig: {

    colorMode: {
      defaultMode: 'light',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },

    navbar: {
      title: 'Tasenor Data Exchange',
      logo: {
        alt: 'Site Logo',
        src: 'logo.png',
        width: 32,
        height: 32,
      },
      items: process.env.NODE_ENV === 'dev' ? [
        {
          to: 'service',
          position: 'right',
          label: 'Service',
        },
        {
          to: 'team',
          position: 'right',
          label: 'Team',
        },
        {
          to: 'contact',
          position: 'right',
          label: 'Contact',
        },
        {
          type: 'docSidebar',
          sidebarId: 'docSidebarId',
          position: 'right',
          label: 'Documentation',
        },
        {
          type: 'localeDropdown',
          position: 'right',
          className: 'language-selector',
        },
      ]: [
        {
          to: 'service',
          position: 'right',
          label: 'Service',
        },
        {
          to: 'team',
          position: 'right',
          label: 'Team',
        },
        {
          type: 'docSidebar',
          sidebarId: 'docSidebarId',
          position: 'right',
          label: 'Documentation',
        },
        {
          type: 'localeDropdown',
          position: 'right',
          className: 'language-selector',
        },
      ]
    },

    footer: {
      style: 'dark',
      links: [
      ],
      copyright: `${new Date().getFullYear()} Copyright © Dataplug Oy`,
    },

    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },

  } satisfies Preset.ThemeConfig,
};

export default config;
