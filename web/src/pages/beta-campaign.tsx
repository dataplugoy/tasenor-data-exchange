/// <reference types="@docusaurus/module-type-aliases" />
/// <reference types="@docusaurus/theme-classic" />
import React from 'react'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import Translate from '@docusaurus/Translate'
import useMediaQuery from '@custom-react-hooks/use-media-query'

export default function Index(): JSX.Element {
  const { siteConfig } = useDocusaurusContext()
  const isWide = useMediaQuery('(min-width: 800px)')

  return (
    <Layout title={`${siteConfig.title}`}>
      <div style={{ padding: '6rem' }}>

        <div style={{ display: isWide ? 'grid' : 'block', gridTemplateColumns: '1fr 1fr', columnGap: '3rem' }}>

          <div style={{ marginBottom: '2rem' }}>
            <img src="circuit.jpeg" style={{ borderRadius: '50%' }}/>
          </div>

          <div>
            <div style={{ fontWeight: 500, fontSize: '1.2rem' }}>
              <Translate>We have developed an application that auto-generates bookkeeping transactions from stockbroker data and effortlessly transfers them to your current bookkeeping system.</Translate>
              <Translate>Currently, we offer integration between Nordnet and Procountor, and plan to add more partners soon.</Translate>
            </div>

            <br/>
            <br/>

            <ul style={{ color: '#E3D344' }}>
              <li><Translate>Join our beta program NOW!</Translate></li>
              <li><Translate>Early adopters get 3 years of free usage.</Translate></li>
            </ul>

            <br/>
            <br/>

            <center>
              <a className="demo-button" href="/docs/guides/nordnet-example">Read More</a>
              <br/>
              <br/>
              <a target="_new" href="mailto:communications.tasenor@gmail.com">Ask for More Information</a>
            </center>
          </div>
        </div>
      </div>
    </Layout>
  )
}
