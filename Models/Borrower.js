// Models/Borrower.js
const borrowerSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    borrowedBooks: [{
      book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book'
      },
      borrowDate: {
        type: Date,
        default: Date.now
      },
      dueDate: {
        type: Date,
        default: () => new Date(+new Date() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
      }
    }],
    membershipActive: {
      type: Boolean,
      required: true
    },
    membershipType: {
      type: String,
      required: true,
      enum: ['Standard', 'Premium']
    }
  });
  
  const Borrower = mongoose.model('Borrower', borrowerSchema);