const { ApolloServer, UserInputError, gql } = require('apollo-server')
const {v1: uuid} = require('uuid')

let authors = [
  {
    name: 'Robert Martin',
    id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
    born: 1952,
  },
  {
    name: 'Martin Fowler',
    id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
    born: 1963
  },
  {
    name: 'Fyodor Dostoevsky',
    id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
    born: 1821
  },
  { 
    name: 'Joshua Kerievsky', // birthyear not known
    id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
  },
  { 
    name: 'Sandi Metz', // birthyear not known
    id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
  },
]

/*
 * Saattaisi olla järkevämpää assosioida kirja ja sen tekijä tallettamalla kirjan yhteyteen tekijän nimen sijaan tekijän id
 * Yksinkertaisuuden vuoksi tallennamme kuitenkin kirjan yhteyteen tekijän nimen
*/

let books = [
  {
    title: 'Clean Code',
    published: 2008,
    author: 'Robert Martin',
    id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']
  },
  {
    title: 'Agile software development',
    published: 2002,
    author: 'Robert Martin',
    id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
    genres: ['agile', 'patterns', 'design']
  },
  {
    title: 'Refactoring, edition 2',
    published: 2018,
    author: 'Martin Fowler',
    id: "afa5de00-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']
  },
  {
    title: 'Refactoring to patterns',
    published: 2008,
    author: 'Joshua Kerievsky',
    id: "afa5de01-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring', 'patterns']
  },  
  {
    title: 'Practical Object-Oriented Design, An Agile Primer Using Ruby',
    published: 2012,
    author: 'Sandi Metz',
    id: "afa5de02-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring', 'design']
  },
  {
    title: 'Crime and punishment',
    published: 1866,
    author: 'Fyodor Dostoevsky',
    id: "afa5de03-344d-11e9-a414-719c6709cf3e",
    genres: ['classic', 'crime']
  },
  {
    title: 'The Demon ',
    published: 1872,
    author: 'Fyodor Dostoevsky',
    id: "afa5de04-344d-11e9-a414-719c6709cf3e",
    genres: ['classic', 'revolution']
  },
]

const typeDefs = gql`

  type Book {
      title: String!
      published: Int!
      author: String
      id: ID!
      genres: [String!]
  }

  type Authors {
      name: String!
      booksCount: Int!
      id: ID!
      born: Int
  }


  type Query {
      bookCount: Int!
      authorCount: Int!
      allBooks(author: String genre: String): [Book!]!
      allAuthors: [Authors!]!
    }

    type Mutation {
      addBook(
        title: String!
        author: String!
        published: Int!
        genres: [String]
      ): Book
      editAuthor(
        name: String!
        setBornTo: Int!
      ): Authors
    }
    
`


const resolvers = {
  Query: {
      bookCount: () => books.length,
      authorCount: () => authors.length,
      allBooks: (root, args) => {
        if(!args.author && !args.genre) return books
        
        if(args.author && args.genre){
          if(authors.find(f => f.name === args.author)){
            let authorBooks = books.filter(books => books.author === args.author)
            let genres = authorBooks.filter(books => books.genres.includes(args.genre))
             if(genres.length < 1) throw new UserInputError('This genre doesn`t exist')
             return genres.map(mp => {return {author:mp.author, title:mp.title}})
          }
        }

        if(args.author){
          if(authors.find(f => f.name === args.author)){
            let authorBooks = books.filter(books => books.author === args.author)
            let titles = authorBooks.map(book =>{return {title:book.title}})
            return titles
          }
            throw new UserInputError('This author doesn`t exist',{
              invalidArgs: args.author
            })
        }
        
        if(args.genre){
          let genres = books.filter(filt => filt.genres.includes(args.genre))
          if(genres.length > 0){
             return genres.map(mp => {return {title: mp.title, author: mp.author}})
          }
        }
      } ,
      allAuthors: () => {
        let allAuthors = authors.map(authors => {
            return {
              name: authors.name,
              booksCount: books.filter(f => f.author === authors.name).length,
              born: authors.born || null              
            }
          })
            return allAuthors
      },
  },
  Mutation: {
    addBook: (root, args) => {
      if(!authors.find(au => au.name === args.author)) authors = authors.concat({name:args.author, id: uuid()})
      if(!books.find(book => book.title === args.title)){
        books = books.concat({...args,born: args.born || null, id: uuid()})
        return books[books.length-1]
      }
      throw new UserInputError('This book already exist')
    },
    editAuthor: (root, args) => {
      if(authors.find(f => f.name === args.name)){
        let author = authors.find(f => f.name === args.name)
        let editedAuthor = {...author, born: args.setBornTo}
        return editedAuthor
      }
      return null
    }
  },
  
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})