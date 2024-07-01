/// <reference types="@docusaurus/module-type-aliases" />
/// <reference types="@docusaurus/theme-classic" />
import React from 'react'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import Translate from '@docusaurus/Translate'
import { localeUrl } from '../components/utils'

export default function Index(): JSX.Element {
  const { siteConfig } = useDocusaurusContext()

  return (
    <Layout title={`${siteConfig.title}`}>
      <div style={{
            backgroundImage: 'url("background.png")',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
      }}>

        <div style={{
            letterSpacing: '-0.4rem',
            paddingTop: '10rem',
            marginLeft: 'auto',
            marginRight: 'auto',
            textAlign: 'center',
            fontSize: '10rem',
            width: '70%',
            lineHeight: '9rem',
            color: 'var(--tadex-fg-color)',
          }}
        >
          <Translate id="embrace-automation">Embrace Automation</Translate>
        </div>

        <div style={{
            paddingTop: '10rem',
            fontSize: '1.6rem',
            textAlign: 'center',
            color: 'var(--tadex-fg-color)',

        }}>
          <Translate id="automate-simplify-excel">automate. simplify. excel</Translate>
        </div>

        <div style={{
            paddingTop: '3rem',
            textAlign: 'center',

        }}>
          <a className="link-button" href={localeUrl('/docs/guides/nordnet-example')}><Translate id="read-more">Learn More</
            Translate></a>
        </div>

      </div>
    </Layout>
  )
}
