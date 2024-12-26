const Author = require('../Models/Author.js')
const Borrower = require('../Models/Borrower.js')
const Book = require('../Models/Book.js')


// Controllers/authorController.js
const authorController = {
    // Create new author
    async createAuthor(req, res) {
      try {
        const author = new Author(req.body);
        await author.save();
        res.status(201).json(author);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },
  
    // Get all authors
    async getAuthors(req, res) {
      try {
        const authors = await Author.find().populate('books');
        res.json(authors);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },
  
    // Get authors exceeding book limit
    async getAuthorsExceedingLimit(req, res) {
      try {
        const authors = await Author.find().populate('books');
        const exceedingAuthors = authors.filter(author => author.books.length > 5);
        res.json(exceedingAuthors);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },
    async updateAuthor(req, res) {
        try {
            const { id } = req.params;
            const updatedAuthor = await Author.findByIdAndUpdate(
                id,
                req.body,
                { new: true, runValidators: true }
            );
            
            if (!updatedAuthor) {
                return res.status(404).json({ error: 'Author not found' });
            }
            
            res.json(updatedAuthor);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async deleteAuthor(req, res) {
        try {
            const { id } = req.params;
            const author = await Author.findById(id);
            
            if (!author) {
                return res.status(404).json({ error: 'Author not found' });
            }

            // Check if author has any books
            if (author.books.length > 0) {
                return res.status(400).json({ 
                    error: 'Cannot delete author with associated books' 
                });
            }

            await Author.findByIdAndDelete(id);
            res.json({ message: 'Author deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
  };
  
  // Controllers/bookController.js
  const bookController = {
    // Create new book
    async createBook(req, res) {
      try {
        const book = new Book(req.body);
        const author = await Author.findById(book.author);
        
        if (!author) {
          return res.status(404).json({ error: 'Author not found' });
        }
  
        if (author.books.length >= 5) {
          return res.status(400).json({ error: 'Author has reached maximum book limit' });
        }
  
        await book.save();
        author.books.push(book._id);
        await author.save();
        
        res.status(201).json(book);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },
  
    // Get all books
    async getBooks(req, res) {
      try {
        const books = await Book.find().populate('author');
        res.json(books);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },

    async updateBook(req, res) {
        try {
            const { id } = req.params;
            const book = await Book.findById(id);
            
            if (!book) {
                return res.status(404).json({ error: 'Book not found' });
            }

            // If author is being changed, check new author's book limit
            if (req.body.author && req.body.author !== book.author.toString()) {
                const newAuthor = await Author.findById(req.body.author);
                if (newAuthor.books.length >= 5) {
                    return res.status(400).json({ error: 'New author has reached maximum book limit' });
                }
                
                // Remove book from old author's list
                const oldAuthor = await Author.findById(book.author);
                oldAuthor.books = oldAuthor.books.filter(b => b.toString() !== id);
                await oldAuthor.save();
                
                // Add to new author's list
                newAuthor.books.push(id);
                await newAuthor.save();
            }

            const updatedBook = await Book.findByIdAndUpdate(
                id,
                req.body,
                { new: true, runValidators: true }
            );
            
            res.json(updatedBook);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async deleteBook(req, res) {
        try {
            const { id } = req.params;
            const book = await Book.findById(id);
            
            if (!book) {
                return res.status(404).json({ error: 'Book not found' });
            }

            // Remove book from author's books array
            const author = await Author.findById(book.author);
            author.books = author.books.filter(b => b.toString() !== id);
            await author.save();

            // Check if book is currently borrowed
            const borrowers = await Borrower.find({
                'borrowedBooks.book': id
            });

            if (borrowers.length > 0) {
                return res.status(400).json({ 
                    error: 'Cannot delete book that is currently borrowed' 
                });
            }

            await Book.findByIdAndDelete(id);
            res.json({ message: 'Book deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
  };
  
  // Controllers/borrowController.js
  const borrowController = {
    // Borrow a book
    async borrowBook(req, res) {
      try {
        const { borrowerId, bookId } = req.body;
        const borrower = await Borrower.findById(borrowerId);
        const book = await Book.findById(bookId);
  
        if (!borrower || !book) {
          return res.status(404).json({ error: 'Borrower or book not found' });
        }
  
        if (!borrower.membershipActive) {
          return res.status(400).json({ error: 'Membership is not active' });
        }
  
        const borrowLimit = borrower.membershipType === 'Premium' ? 10 : 5;
        if (borrower.borrowedBooks.length >= borrowLimit) {
          return res.status(400).json({ error: 'Borrowing limit reached' });
        }
  
        if (book.availableCopies <= 0) {
          return res.status(400).json({ error: 'No copies available' });
        }
  
        // Check for overdue books
        const hasOverdueBooks = borrower.borrowedBooks.some(
          borrowed => borrowed.dueDate < new Date()
        );
        if (hasOverdueBooks) {
          return res.status(400).json({ error: 'Cannot borrow with overdue books' });
        }
  
        book.availableCopies -= 1;
        book.borrowCount += 1;
        await book.save();
  
        borrower.borrowedBooks.push({
          book: bookId,
          borrowDate: new Date(),
          dueDate: new Date(+new Date() + 14 * 24 * 60 * 60 * 1000)
        });
        await borrower.save();
  
        res.json({ message: 'Book borrowed successfully' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },
  
    // Return a book
    async returnBook(req, res) {
      try {
        const { borrowerId, bookId } = req.body;
        const borrower = await Borrower.findById(borrowerId);
        const book = await Book.findById(bookId);
  
        if (!borrower || !book) {
          return res.status(404).json({ error: 'Borrower or book not found' });
        }
  
        const borrowedBookIndex = borrower.borrowedBooks.findIndex(
          item => item.book.toString() === bookId
        );
  
        if (borrowedBookIndex === -1) {
          return res.status(400).json({ error: 'Book not borrowed by this user' });
        }
  
        borrower.borrowedBooks.splice(borrowedBookIndex, 1);
        await borrower.save();
  
        book.availableCopies += 1;
        await book.save();
  
        res.json({ message: 'Book returned successfully' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  };

  const borrowerController = {
    async createBorrower(req, res) {
        try {
            const borrower = new Borrower(req.body);
            await borrower.save();
            res.status(201).json(borrower);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    async getBorrowers(req, res) {
        try {
            const borrowers = await Borrower.find()
                .populate({
                    path: 'borrowedBooks.book',
                    populate: {
                        path: 'author'
                    }
                });
            res.json(borrowers);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async getBorrowerById(req, res) {
        try {
            const borrower = await Borrower.findById(req.params.id)
                .populate({
                    path: 'borrowedBooks.book',
                    populate: {
                        path: 'author'
                    }
                });
                
            if (!borrower) {
                return res.status(404).json({ error: 'Borrower not found' });
            }
            
            res.json(borrower);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    async updateBorrower(req, res) {
        try {
            const { id } = req.params;
            const updatedBorrower = await Borrower.findByIdAndUpdate(
                id,
                req.body,
                { new: true, runValidators: true }
            );
            
            if (!updatedBorrower) {
                return res.status(404).json({ error: 'Borrower not found' });
            }
            
            res.json(updatedBorrower);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
};
  
  module.exports = {
    Author,
    Book,
    Borrower,
    authorController,
    bookController,
    borrowController,
    borrowerController
  };