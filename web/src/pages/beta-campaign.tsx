/// <reference types="@docusaurus/module-type-aliases" />
/// <reference types="@docusaurus/theme-classic" />
import React from 'react'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import Translate from '@docusaurus/Translate'

export default function Index(): JSX.Element {
  const { siteConfig } = useDocusaurusContext()

  return (
    <Layout title={`${siteConfig.title}`}>
      <div className="beta-campaign">


        <div className="brief">
          <Translate>We have developed an application to automatically generate bookkeeping transactions from stock broker data and transfer them to your bookkeeping.</Translate>
        </div>

        <div className="partner-images">
          <img src="/nordnet.png"/>
          <img src="/procountor.png"/>
        </div>

        <ul>
          <li><Translate>You can join our beta program NOW!</Translate></li>
          <li><Translate>You will get free usage for 3 years.</Translate></li>
          <li><Translate>Currently we can do from Nordnet to Procountor, but more partners will be added soon.</Translate></li>
        </ul>

        <br/>

        <center>
          <a className="demo-button" href="/docs/guides/nordnet-example">Read More</a>
          <br/>
          <br/>
          <a target="_new" href="mailto:communications.tasenor@gmail.com">Ask for More Information</a>
        </center>
      </div>
    </Layout>
  )
}
