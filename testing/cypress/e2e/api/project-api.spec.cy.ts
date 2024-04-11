import ProjectsResponse from './schema/projects/ProjectsResponse.json'


describe('Projects API', () => {
  it('GET /', () => {
    cy.apiCall('POST', '/auth', { email: 'test@localhost', password: 'pass' }).then(res => {
      cy.apiCall('GET', '/projects').should('validatesAs', ProjectsResponse)
    })
  })
})
