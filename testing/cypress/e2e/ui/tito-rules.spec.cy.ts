describe('TITO import with mapping rules', () => {
  it('Unmatched lines are handled with a new rule and one-off answers', () => {
    cy.login()

    cy.get('[data-cy="FlowPlan-TITO Testing"]').click()
    cy.get('button').contains('Run').click()

    // Upload the statement.
    cy.get('#file-uploader-input').selectFile('unit/data/Nordea-tito.nda', { force: true })
    cy.get('button').contains('Upload').click()

    // No rules yet, so all lines are asked.
    cy.get('[data-cy="UnmatchedLines"] tbody tr').should('have.length', 6)

    // Create a rule from the card purchase.
    cy.get('[data-cy="Unmatched-2301150004"] [data-cy="CreateRule"]').click()
    cy.get('[data-cy="RuleName"] input').should('have.value', 'Saaja/Maksaja is "OVHcloud", money out')
    cy.get('label').contains('Category or account number').parent().find('input').type('Software{downArrow}{enter}')
    cy.get('body').should('contain', '1 of 6 recent lines match.')
    // Field names show the values seen in the matching lines.
    cy.get('[data-cy="FieldValues-Saaja/Maksaja"]').click()
    cy.get('.MuiPopover-paper').should('contain', 'OVHcloud')
    cy.get('body').type('{esc}')
    // Decimal VAT with a comma is kept as typed and 100.80 includes 20.48 VAT.
    cy.get('[data-cy="VatRate"] input').type('25,5')
    cy.get('[data-cy="VatRate"] input').should('have.value', '25,5')
    cy.get('body').should('contain', 'VAT from purchases')
    cy.get('body').should('contain', '20.48')
    cy.get('[data-cy="SaveRule"]').click()
    cy.get('[data-cy="Unmatched-2301150004"]').should('contain', 'Rule created')

    // Handle two lines once.
    cy.get('[data-cy="Unmatched-2301030001"] [data-cy="HandleOnce"]').click()
    cy.get('label').contains('Category or account number').parent().find('input').type('Investment services{downArrow}{enter}')
    cy.get('[data-cy="UseOnce"]').click()
    cy.get('[data-cy="Unmatched-2301030001"]').should('contain', 'Handled once')

    cy.get('[data-cy="Unmatched-2301310005"] [data-cy="HandleOnce"]').click()
    cy.get('label').contains('Category or account number').parent().find('input').type('Banking fees{downArrow}{enter}')
    cy.get('label').contains('Text').parent().find('input').clear().type('Bank fees')
    cy.get('[data-cy="UseOnce"]').click()

    // Skip the rest.
    cy.get('[data-cy="Unmatched-2301030002"] [data-cy="SkipOnce"]').click()
    cy.get('[data-cy="Unmatched-2301030003"] [data-cy="SkipOnce"]').click()
    cy.get('[data-cy="Unmatched-2301200006"] [data-cy="SkipOnce"]').click()

    cy.get('[data-cy="DialogButton-Delete"]').contains('Continue').click()

    // The first batch asks to confirm the opening balances of the accounts from the statement.
    cy.get('[role="dialog"]').should('contain', 'BANK_FI001234560000')
    cy.get('[role="dialog"]').should('contain', 'BANK_FI006543210000')
    cy.get('[data-cy="DialogButton-Delete"]').contains('Continue').click()

    // The rule and two one-off answers make three transactions.
    cy.get('[data-cy="Batch-#1"] [data-cy="output"]').should('have.text', '3')
    cy.get('[data-cy="Batch-#1"]').click()
    cy.get('body').should('contain', 'Results successfully delivered')

    // The rule is listed and has been used once.
    cy.url().then(url => {
      const id = url.split('/').pop()
      cy.visit(`/app/rules/${id}`)
    })
    cy.get('[data-cy="RuleTable"]').should('contain', 'Saaja/Maksaja is "OVHcloud", money out')
    cy.get('[data-cy="RuleTable"]').should('contain', 'Expense, Software, VAT 25.5%')
    cy.get('[data-cy="Rule-Saaja/Maksaja is \\"OVHcloud\\", money out"] td').eq(4).should('have.text', '1')

    // The match count opens the transaction created by the rule.
    cy.get('[data-cy="RuleMatches-Saaja/Maksaja is \\"OVHcloud\\", money out"]').click()
    cy.get('[role="dialog"] [data-cy="TransactionTable"]').should('contain', '100.80')
    cy.get('[role="dialog"] [data-cy="TransactionTable"]').should('contain', 'Delivered successfully')
    cy.get('[role="dialog"] button').contains('Close').click()
  })
})
