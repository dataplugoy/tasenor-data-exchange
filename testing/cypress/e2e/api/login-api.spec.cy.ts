import AuthResponse from './schema/auth/AuthResponse.json'


describe('Login API', () => {
  it('POST /auth', () => {

    cy.apiCall('POST', '/auth', { email: 'foo', password: 'pass' }).should('have.property', 'status', 403)
    cy.apiCall('POST', '/auth', { foo: 'bar' }).should('have.property', 'status', 400)

    cy.apiCall('POST', '/auth', { email: 'test@localhost', password: 'pass' }).should('validatesAs', AuthResponse)
  })

  it('Email does not depend on the case of the letters', () => {
    cy.apiCall('POST', '/auth', { email: ' Test@LocalHost ', password: 'pass' }).should('validatesAs', AuthResponse)
    cy.apiCall('POST', '/auth/register', { email: 'TEST@localhost', password: 'pass', name: 'Again', projectName: 'Again' })
      .should('have.property', 'status', 400)
  })
})
