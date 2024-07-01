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
      <div style={{
        backgroundImage: 'url(background.png)',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right top',
        backgroundSize: '15rem 15rem',
      }}>

        <div className="title" style={{
          textAlign: 'right',
          marginRight: '10rem'
        }}>
          <Translate id="team">Team</Translate>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'auto 30rem 30rem 30rem auto',
          marginTop: '4rem',
        }}>
          <div></div>

          <div style={{
            textAlign: 'center'
          }}>
            <img style={{ width: '70%', height: '400px', borderRadius: '1rem' }} src="matias.png"/>
            <span className="link-button" style={{ display: 'inline-block', marginTop: '1rem' }}>
              Matias Aunola
              <br/>
              <Translate id="team-lead">Project Lead & Research</Translate>
            </span>
            <div style={{ marginTop: '2rem' }}>
              <a target="_new" href="https://www.linkedin.com/in/matiasaunola/">
                <img src="in.png" className="linked-in"/>
              </a>
            </div>
          </div>

          <div style={{
            textAlign: 'center'
          }}>
            <img style={{ width: '70%', height: '400px', borderRadius: '1rem' }} src="khaya.png"/>
            <span className="link-button" style={{ display: 'inline-block', marginTop: '1rem' }}>
              Khaya Ronkainen
              <br/>
              <Translate id="team-web">Web & Marketing</Translate>
            </span>
            <div style={{ marginTop: '2rem' }}>
              <a target="_new" href="https://www.linkedin.com/in/khayaronkainen/">
                <img src="in.png" className="linked-in"/>
              </a>
            </div>
          </div>

          <div style={{
            textAlign: 'center'
          }}>
            <img style={{ width: '70%', height: '400px', borderRadius: '1rem' }} src="tommi.png"/>
            <span className="link-button" style={{ display: 'inline-block', marginTop: '1rem' }}>
              Tommi Ronkainen
              <br/>
              <Translate id="team-dev">Development & Maintenance</Translate>
            </span>
            <div style={{ marginTop: '2rem' }}>
              <a target="_new" href="https://www.linkedin.com/in/wigys/">
                <img src="in.png" className="linked-in"/>
              </a>
            </div>
          </div>

          <div></div>
        </div>
      </div>
    </Layout>
  )
}
