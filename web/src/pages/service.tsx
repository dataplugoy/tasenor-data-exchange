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
      <div className="split-half" style={{ padding: '3rem' }}>
        <div>
          <div className="title"><Translate id="service">Service</Translate></div>

          <div className="body-text">
            <Translate id="service-1">
            We can't speak for you, but we find the meticulous task of extracting data from bank statements for bookkeeping tiresome.
            </Translate>
          </div>

          <br/>

          <div className="body-text">
            <Translate id="service-2">
            Moreover, incorrect data can distort financial reports, leading to missed tax benefits or potential penalties.
            </Translate>
          </div>

          <br/>

          <div className="body-text">
            <Translate id="service-3">
            Do you share the same frustrations? We created a solution with you in mind.
            </Translate>
          </div>

          <br/>
          <center>
            <a target="_new" className="link-button" href={localeUrl('/go?prod-login')}><b>Tasenor Data Exchange</b></a>
          </center>

          <br/>
          <div className="body-text">
            <Translate id="service-4">
            It's a service that automates and simplifies data processing for accurate bookkeeping and financial management.
            </Translate>
          </div>

          <br/>
          <center>
            <a className="link-button" href={localeUrl('/docs/guides/processing')}><Translate>How TaDeX Works?</Translate></a>
          </center>

          <br/>
          <div className="body-text">
            <Translate id="service-5">
            Simply upload your bank statements and TaDeX will automatically organise and input the data into your bookkeeping system.
            </Translate>
          </div>
        </div>

        <div>
          <img src="workflow.jpeg" style={{
            border: 'solid 1rem black',
            outline: 'solid 5px gray',
            width: '80%',
            borderRadius: '1rem',
            marginTop: '10rem',
            transform: 'rotate(20deg)'
          }}/>
        </div>
      </div>
    </Layout>
  )
}
