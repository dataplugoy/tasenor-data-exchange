import Ajv from 'ajv'
import AuthResponse from './schema/auth/AuthResponse.json'


describe('Login API', () => {
  it('/auth', () => {
    const url = new URL(Cypress.env('CYPRESS_URL'))
    const apiUrl = `${url.protocol}//${url.hostname}:${parseInt(url.port) + 1}/api/v1`

    cy.request({
      failOnStatusCode: false,
      method: 'POST',
      url: `${apiUrl}/auth`,
      body: { email: 'foo', password: 'pass' }
    }).then(res => {
      expect(res.status).to.eq(401)
    })

    cy.request({
      failOnStatusCode: false,
      method: 'POST',
      url: `${apiUrl}/auth`,
      body: { foo: 'bar' }
    }).then(res => {
      expect(res.status).to.eq(400)
    })

    cy.request({
      failOnStatusCode: false,
      method: 'POST',
      url: `${apiUrl}/auth`,
      body: { email: 'test@localhost', password: 'pass' }
    }).then(res => {
      expect(res.status).to.eq(200)

      const ajv = new Ajv()
      console.log(ajv.validate(AuthResponse, res.body))
      console.log(ajv.errors)
      console.log(res.body)
    })

  })
})
