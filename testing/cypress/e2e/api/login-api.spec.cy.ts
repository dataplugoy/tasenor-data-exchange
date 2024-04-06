import AuthResponse from './schema/auth/AuthResponse.json'


describe('Login API', () => {
  it('/auth', () => {

    cy.apiCall('POST', '/auth', { email: 'foo', password: 'pass' }).should('have.property', 'status', 401)
    cy.apiCall('POST', '/auth', { foo: 'bar' }).should('have.property', 'status', 400)

    cy.apiCall('POST', '/auth', { email: 'test@localhost', password: 'pass' }).should('validatesAs', AuthResponse)
  })
})
