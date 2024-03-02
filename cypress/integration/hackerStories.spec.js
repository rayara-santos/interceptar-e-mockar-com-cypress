describe('interceptar e mockar com cypress', () => {
  const initialTerm = 'React'
  const newTerm = 'Cypress'
  context('Batendo na API', () =>{
    beforeEach(() => {
      cy.intercept({
        method: 'GET',
        pathname: '**/search',
        query: {
          query: initialTerm,
          page: '0'
        }
      }).as('getStories')
      cy.visit('/')
      cy.wait('@getStories')
      cy.contains('More').should('be.visible')
    })

    it('Exibindo itens de pag2 com "More"', () => {
      cy.intercept({
        method: 'GET',
        pathname: '**/search',
        query: {
          query: initialTerm,
          page: '1'
        }
      }).as('getNextStories')
      cy.visit('/')

      cy.get('.item').should('have.length', 20)
      cy.contains('More').click()
      cy.wait('@getNextStories')
      cy.get('.item').should('have.length', 40)
    })

    it('pesquisa pelo último termo pesquisado', () => {
      cy.intercept({
        method: 'GET',
        pathname: '**/search',
        query: {
          query: newTerm,
          page: '0'
        }
      }).as('getNewTermStories')

      cy.get('#search')
        .clear()
       
      cy.get('#search')
        .type(`${newTerm}{enter}`)

      cy.wait('@getNewTermStories')

      cy.get(`button:contains(${initialTerm})`)
        .should('be.visible')
        .click()

        cy.wait('@getStories')

      cy.get('.item').should('have.length', 20)
      cy.get('.item')
        .first()
        .should('contain', initialTerm)
      cy.get(`button:contains(${newTerm})`)
        .should('be.visible')
    })

    it('exibir no máximo 5 botões para os últimos termos pesquisados a max of 5 buttons for the last searched terms', () => {
      const faker = require('faker')
      cy.intercept(
        'GET',
        '**/search**'
      ).as('getRandom')

      Cypress._.times(6, () => {
        cy.get('#search')
          .clear()
          .type(`${faker.random.word()}{enter}`)
          .wait('@getRandom')
      })
      cy.get('.last-searches button')
        .should('have.length', 5)
    })
  })

  context('Mockando a API', () =>{

    context('fixture preenchido', () => {
      beforeEach(() => {
        cy.intercept(
          'GET',
          '**/search**',
          {fixture: 'stories'}
        ).as('getStories')
  
        cy.visit('/')

      })
      it('mostra apenas a segunda história após descartar a primeira história', () => {
   
        cy.wait('@getStories')
        cy.get('.button-small')
          .first()
          .click()
  
        cy.get('.item').should('have.length', 1)
      })
    })
   
    context('fixture vazio', () =>{
      beforeEach(() => {
        cy.intercept(
          'GET',
          '**/search**',
          {fixture: 'empty'}
        ).as('getEmptyStories')
  
        cy.intercept(
          'GET',
         `**/search?query=${newTerm}&page=0`,
         {fixture: 'stories'}
         ).as('getStory')

        
        cy.visit('/')
        cy.wait('@getEmptyStories')

        cy.get('#search')
          .clear()
      })

      it('digita e pressiona ENTER', () => {
        cy.get('#search')
          .type(`${newTerm}{enter}`)
          

        cy.get(`button:contains(${initialTerm})`)
          .should('be.visible')
      })
  
    })
  })

  } )


context('Erros', () => {

  it('testa erro no servidor', () => {
    cy.intercept(
      'GET',
      '**/search**',
      { statusCode: 500 }
    ).as('getServerFailure')

    cy.visit('/')

    cy.wait('@getServerFailure')

    cy.get('p:contains(Something went wrong ...)')
      .should('be.visible')
  })

  it('testa erro na rede', () => {
    cy.intercept(
      'GET',
      '**/search**',
      { forceNetworkError: true }
    ).as('getNetworkFailure')
    cy.visit('/')

    cy.wait('@getNetworkFailure')
    cy.get('p:contains(Something went wrong ...)')
    .should('be.visible')
    })
}) 
