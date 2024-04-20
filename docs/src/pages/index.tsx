import React from 'react'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import Heading from '@theme/Heading'

import styles from './index.module.css'

export default function Index(): JSX.Element {
  const { siteConfig } = useDocusaurusContext()
  return (
    <Layout title={`${siteConfig.title}`}>
      <Heading as="h1" className={styles.heading}>
        Coming Soon....
      </Heading>

      <main className={styles.content}>
        <div>
          [ PICTURE 1 HERE ]<br/>
          Caption: Enjoy Automation
        </div>
        <br/>
        <div>
          <ol>
            <li>Sign up to TaDeX. Set up credentials for your stock broker and for your bookkeeping software.</li>
            <li>Run synchronization manually and check how transactions are sorted out from the stock broker. After that they are pushed to your bookkeeping. Afterwards, let the data flow automatically on daily basis without any intervention.</li>
          </ol>
        </div>

        <br/>

        <div>
          [ PICTURE 2 HERE ]<br/>
          Caption: Build Your Own Rules
        </div>
        <br/>
        <div>
          <ol>
            <li>Sign up to TaDeX. Set up credentials for your bookkeeping software. Select the bank to use.</li>
            <li>Run synchronization manually and let TaDeX fetch and analyze the latest statement.</li>
            <li>TaDeX will construct transactions for known cases, but stops but asks you about details for unknown cases.</li>
            <li>Answer questions about details either once off or create also permanent rule for future use. In that case you the next time the transaction is handled automatically.</li>
            <li>Let TaDeX push all new transactions to your bookkeeping.</li>
          </ol>
        </div>

      </main>
    </Layout>
  )
}
