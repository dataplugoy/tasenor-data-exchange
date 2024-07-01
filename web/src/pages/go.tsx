/// <reference types="@docusaurus/module-type-aliases" />
/// <reference types="@docusaurus/theme-classic" />
import React, { useEffect } from 'react'
import { useLocation } from '@docusaurus/router';

export default function Index(): JSX.Element {
  const loc = useLocation()
  let redirectUrl = '/'
  switch (loc.search) {
    case '?stg-registration':
      redirectUrl = 'https://tadex.stg.tasenor.com/register'
      break
    case '?stg-registration-fi':
      redirectUrl = 'https://tadex.stg.tasenor.com/fi/register'
      break
    case '?prod-registration':
      redirectUrl = 'https://tadex-app.tasenor.com/app/register'
      break
    case '?prod-registration-fi':
      redirectUrl = 'https://tadex-app.tasenor.com/app/fi/register'
      break
    case '?prod-login':
      redirectUrl = 'https://tadex-app.tasenor.com/app/login'
      break
    case '?prod-login-fi':
      redirectUrl = 'https://tadex-app.tasenor.com/app/fi/login'
      break
  }

  useEffect(() => {
    document.location = redirectUrl
  },[])

  return <></>
}
