describe('Users', () => {
  it('Register a user and create data flow plan', () => {
    cy.fixture('fixtures.json').then((config) => {
      cy.visit('/')

      // Register uer.
      cy.get('button').contains('Register').click()
      cy.url().should('include', '/register')
      cy.contains('Register to Tasenor Data Exchange')

      cy.get('input[name="email"]').type(config.register.user)
      cy.get('input[name="password"]').type(config.register.password)
      cy.get('input[name="password-again"]').type(config.register.password)
      cy.get('input[name="name"]').type(config.register.name)
      cy.get('input[name="address"]').type(config.register.address)
      cy.get('input[name="city"]').type(config.register.city)
      cy.get('input[name="zip"]').type(config.register.zip)
      cy.get('input[name="country"]').type(config.register.country)

      cy.get('button').contains('Register').click()

      // Create data flow plan
      cy.get('[data-cy="Data Flow Plans"]').contains('Create New').click()
      cy.get('input[name="name"]').type('Created by Registered User')
      cy.get('[data-cy="Data Source"]').click()
      cy.get('[data-value="TEST_MOCK"]').click()
      cy.get('input[name="fileUrl"]').type('test.csv')

      cy.get('button').contains('Create').click()

      cy.get('body').should('contain', 'Data Flow Plan: Created by Registered User')

    })

  })
})
