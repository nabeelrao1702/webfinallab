// Models/Author.js
const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  phoneNumber: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\+?[\d\s-]{10,}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  books: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book'
  }]
});

// Validate maximum books per author
authorSchema.pre('save', async function(next) {
  if (this.books.length > 5) {
    throw new Error('An author cannot be linked to more than 5 books');
  }
  next();
});

const Author = mongoose.model('Author', authorSchema);
