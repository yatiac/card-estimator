describe('Landing page', () => {
  beforeEach(() => {
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test
    cy.visit('/');
  });

  it('opens the landing page', () => {
    cy.get('h1')
      .should('contain.text', 'Real-time online planning poker app for remote scrum teams');
  });

  it('can navigate to the /create page', () => {
    cy.contains('Start Planning').click();
    cy.location('pathname').should('eq', '/create');
  });

  it('can go to the Features page', () => {
    cy.contains('Features').click();
    cy.location('pathname').should('eq', '/features');
  })

  it('can go to the FAQ page', () => {
    cy.contains('FAQ').click();
    cy.location('pathname').should('eq', '/faq');
  })

  it('can go to the Zoom page', () => {
    cy.contains('Zoom').click();
    cy.location('pathname').should('eq', '/zoom');
  })
});
