



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

module.exports = {
  Author,
  Book,
  Borrower,
  authorController,
  bookController,
  borrowController
};