import config from './docusaurus.config'

config.themeConfig.navbar.items = [
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
]

console.log('Development config:')
console.dir(config, {depth: null})

export default config;
