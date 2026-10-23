describe('Uploading', () => {
  it('A refused upload shows the reason given by the server', () => {
    cy.login()

    cy.get('[data-cy="FlowPlan-TITO Testing"]').click()
    cy.get('button').contains('Run').click()

    cy.intercept('POST', '/api/v1/flow-plans/*/upload*', { statusCode: 409, body: { message: 'The flow plan is already running.' } })
    cy.get('#file-uploader-input').selectFile('unit/data/Nordea-tito.nda', { force: true })
    cy.get('button').contains('Upload').click()
    cy.get('body').should('contain', 'The flow plan is already running.')
  })
})
