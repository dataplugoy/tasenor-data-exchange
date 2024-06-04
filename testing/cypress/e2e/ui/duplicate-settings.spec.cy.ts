describe('Flow Plans', () => {
  it('Try duplicate handling', () => {
    cy.login()

    cy.get('[data-cy="FlowPlan-Unit Testing with Duplicates"]').click()
    cy.get('button').contains('Run').click()

    cy.get('body').should('contain', 'Include input duplicates')

    cy.get('[data-cy="Option-settings.inputDuplicates-Always"]').click()
    cy.get('button').contains('Continue').click()

    cy.get('[data-cy="Option-settings.outputDuplicates-Never"]').click()
    cy.get('button').contains('Continue').click()

    cy.get('[data-cy="Batch-#1"]').click()

    cy.get('td').contains('Processing started and data fetched')
      .parents('tr').should('contain', '1 / 1').should('contain', 'All Successful')
    cy.get('td').contains('Data successfully parsed')
      .parents('tr').should('contain', '4 / 4').should('contain', 'All Successful')
    cy.get('td').contains('Unable to convert to standard format')
      .parents('tr').should('contain', '1 / 4').should('contain', 'Waiting')
    cy.get('td').contains('Converted to standard format')
      .parents('tr').should('contain', '3 / 3').should('contain', 'All Successful')
    cy.get('td').contains('Unable to complete analysis')
      .parents('tr').should('contain', '1 / 4').should('contain', 'Waiting')
    cy.get('td').contains('Analysed and converted to results')
      .parents('tr').should('contain', '1 / 4').should('contain', 'Skipped Some')
    cy.get('td').contains('Results successfully delivered')
      .parents('tr').should('contain', '1 / 1').should('contain', 'All Successful')
  })
})
