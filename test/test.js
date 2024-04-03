const fs = require("fs")
const jwa = require("jwa")
// const fetch = require('node-fetch');

const jsonBase64 = (data) => {
  return Buffer.from(JSON.stringify(data)).toString("base64").replace("=", "")
}

const privateKey = fs.readFileSync("test/auth/cfb2671e-6788-4d9b-878f-cb4fd7ab1077.pem", "utf8")


const iat = Math.floor((new Date()).getTime() / 1000)
const jwtBody = {
  iss: "enablebanking.com", // always the same value
  aud: "api.enablebanking.com", // always the same value
  iat: iat, // time when the token is created
  exp: iat + 3600 // time when the token is set to expire
}

const jwt = ((exp = 3600) => {
  const header = jsonBase64({
    typ: "JWT",
    alg: "RS256",
    kid: "cfb2671e-6788-4d9b-878f-cb4fd7ab1077" // your application's ID
  })
  const body = jsonBase64(jwtBody)
  const signature = jwa("RS256").sign(`${header}.${body}`, privateKey)
  return `${header}.${body}.${signature}`
})()

const baseHeaders = {
  Authorization: `Bearer ${jwt}`,
  'Content-Type': 'application/json'
}

async function aspsps() {
  const aspspsResponse = await fetch(`https://api.enablebanking.com/aspsps?country=FI`, {
    headers: baseHeaders
  })
  // If you want you can override BANK_NAME and BANK_COUNTRY with any bank from this list
  const text = await aspspsResponse.text()
  console.log('Available ASPSPs:')
  console.dir(JSON.parse(text), {depth: null});
}

async function auth() {
  const validUntil = new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000);
  const startAuthorizationBody = {
    access: {
      valid_until: validUntil.toISOString()
    },
    aspsp: {
      name: "Nordea", // BANK_NAME
      country: "FI" // BANK_COUNTRY
    },
    state: "123e4567-e89b-12d3-a456-426614174000",
    redirect_url: "https://bookkeeper.stg.tasenor.com/", // application's redirect URL
    psu_type: "personal"
  }

  const startAuthorizationResponse = await fetch(`https://api.enablebanking.com/auth`, {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify(startAuthorizationBody)
  })
  const startAuthorizationData = await startAuthorizationResponse.text();
  console.log(`Start authorization data: ${startAuthorizationData}`)

}

async function login(code) {
  const resp = await fetch(`https://api.enablebanking.com/sessions`, {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify({ code })
  })
  const json = await resp.json()
  console.dir(json, { depth: null });
  return json.accounts[0].uid
}

async function balance(accountId) {
  const resp = await fetch(`https://api.enablebanking.com/accounts/${accountId}/balances`, {
    headers: baseHeaders,
  })
  const json = await resp.json()
  console.dir(json, { depth: null });
}

async function txs(accountId) {
  const resp = await fetch(`https://api.enablebanking.com/accounts/${accountId}/transactions`, {
    headers: baseHeaders,
  })
  const json = await resp.json()
  console.dir(json, { depth: null });
}

async function app(accountId) {
  const resp = await fetch(`https://api.enablebanking.com/application`, {
    headers: baseHeaders,
  })
  const json = await resp.json()
  console.dir(json, { depth: null });
}

async function main() {
  // await auth()
  // const code = '472a17b0-7a09-4703-a3e5-ff920aa6a831'
  // const accountId = await login(code)
  // console.log(accountId);
  // await balance(accountId)
  // await txs('345898f8-b045-4158-ba0e-2da531875021')
  await app()
}


// https://bookkeeper.stg.tasenor.com/?state=123e4567-e89b-12d3-a456-426614174000&code=f62bf384-1dbf-4b7e-ace1-5873a20933b8

main().then(() => process.exit())
