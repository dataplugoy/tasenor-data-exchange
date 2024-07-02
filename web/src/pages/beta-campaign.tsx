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
      <div style={{ padding: '6rem' }}>

        <div className="split-half">

          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <img src="circuit.jpeg" style={{ borderRadius: '50%', width: '80%' }}/>

            <br/>
            <br/>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
              <a className="link-button" href={localeUrl('/docs/guides/nordnet-example')}><Translate id="read-more">Learn More</
            Translate></a>
              <a className="link-button" target="_new" href="mailto:communications.tasenor@gmail.com"><Translate id="ask-for-more-info">Contact US</Translate></a>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 500, fontSize: '1.2rem' }}>
              <Translate id="beta-campaign.1">We have developed an application that auto-generates bookkeeping transactions from stockbroker data and effortlessly transfers them to your current bookkeeping system.</Translate>
              <> </>
              <Translate id="beta-campaign.2">Currently, we offer integration between Nordnet and Procountor, and plan to add more partners soon.</Translate>
            </div>

            <br/>
            <br/>

            <ul style={{ color: '#E3D344' }}>
              <li><Translate id="beta-campaign.3">Join our beta program NOW!</Translate></li>
              <li><Translate id="beta-campaign.4">Early adopters get 3 years of free usage.</Translate></li>
              <li><Translate id="beta-campaign.5">Request features and propose partners to support.</Translate></li>
            </ul>

            <br/>
            <br/>

            <center>
              <a className="demo-button" href={localeUrl('/go?prod-registration')}><Translate id="join-now">JOIN NOW</Translate></a>
            </center>
          </div>
        </div>
      </div>
    </Layout>
  )
}
