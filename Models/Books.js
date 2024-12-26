// Models/Book.js
const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Author',
    required: true
  },
  isbn: {
    type: String,
    required: true,
    unique: true
  },
  availableCopies: {
    type: Number,
    required: true,
    min: 0
  },
  borrowCount: {
    type: Number,
    default: 0
  }
});

// Validate copies based on borrow count
bookSchema.pre('save', function(next) {
  if (this.borrowCount > 10 && this.availableCopies > 100) {
    throw new Error('Books borrowed more than 10 times cannot exceed 100 copies');
  }
  next();
});

const Book = mongoose.model('Book', bookSchema);