/// <reference types="@docusaurus/module-type-aliases" />
/// <reference types="@docusaurus/theme-classic" />
import React from 'react'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import Link from '@docusaurus/Link'

export default function Index(): JSX.Element {
  const { siteConfig } = useDocusaurusContext()

  const onClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const pos = (x / (rect.right - rect.left))
    if (pos < 0.34) {
      document.location = 'https://www.linkedin.com/in/matiasaunola/'
      return
    }
    if (pos > 0.64) {
      document.location = 'https://www.linkedin.com/in/wigys/'
      return
    }
    document.location = 'https://www.linkedin.com/in/khayaronkainen/'
  }

  return (
    <Layout title={`${siteConfig.title}`}>
      <img src="3.svg" width="100%" onClick={onClick}/>
    </Layout>
  )
}
