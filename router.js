const express = require("express");
const { 
    authorController, 
    bookController, 
    borrowController,
    borrowerController 
} = require("./Controllers/combinedControllers");

const router = express.Router();

// Base route
router.get("/", (req, res) => {
    res.send("Library Management System API Running Successfully");
});

// Author routes
router.post("/author/create", authorController.createAuthor);
router.get("/authors", authorController.getAuthors);
router.put("/author/:id", authorController.updateAuthor);
router.delete("/author/:id", authorController.deleteAuthor);
router.get("/authors/exceeding-limit", authorController.getAuthorsExceedingLimit);

// Book routes
router.post("/book/create", bookController.createBook);
router.get("/books", bookController.getBooks);
router.put("/book/:id", bookController.updateBook);
// router.get("/books/available", bookController.getAvailableBooks);
router.delete("/book/:id", bookController.deleteBook);

// Borrower routes
router.post("/borrower/create", borrowerController.createBorrower);
router.get("/borrowers", borrowerController.getBorrowers);
router.put("/borrower/:id", borrowerController.updateBorrower);
router.get("/borrower/:id", borrowerController.getBorrowerById);
// router.delete("/borrower/:id", borrowerController.deleteBorrower);
// router.get("/borrowers/overdue", borrowerController.getOverdueBorrowers);

// Borrowing routes
router.post("/borrow", borrowController.borrowBook);
router.post("/return", borrowController.returnBook);



module.exports = router;