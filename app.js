require('dotenv').config(); // Einbinden und die config aufrufen das dotenv verwendet werden kann für die umgebungsvariablen
const fs = require('fs');

const path = require('path');
const PORT = process.env.PORT;  // process-objekt gibt mir alles aus (welcher rechner, welches betriebssystem)
const exp = require('constants');
const express = require("express");
const { json } = require('express');
const { AsyncLocalStorage } = require('async_hooks');
const app = express(); // erstellt einen Server!

// Builds proper path depending on OS
const staticpath = path.join(__dirname, 'public'); // erstellt mir einen Pfad zu meiner Index.html

let bookJsonPath = path.join(__dirname, 'json', "books.json");
let idJsonPath = path.join(__dirname, 'json', "lastid.json");
let logPath = path.join(__dirname, 'json', "log.log");


///   ROUTINGS   ///
// API ENDPOINTS! - sind die URLs die ich selbst definiere

app.use(express.json());  // jetzt weiß der Server das er mit JSON Files arbeiten muss!
app.use(express.static(staticpath)); // Link zur index html seite


/////////   LOGGING   /////////
const logText = text => {
  let logString = new Date().toISOString() + ' ' + text + '\n';

  fs.appendFileSync(logPath, logString);
};

const log = text => {
  logText("    " + text);
};

const logRequest = (requestType, endpoint, ip, textToLog) => {
  logText(requestType.padEnd(6) + ' at endpoint: ' + endpoint + ' from client: ' + ip + ' ' + textToLog);
};

const logRequestWithBody = (requestType, endpoint, ip, textToLog, body) => {
  logRequest(requestType, ip, endpoint, ' with body: ' + JSON.stringify(body) + ' ' + textToLog);
};

const logError = (text) => {
  logText('ERROR: ' + text);
  console.error(error);
};




/////////   ALLE BÜCHER ANZEIGEN - STARTSEITE   /////////
app.get('/books', (req, res) => {     // /books ist der selbst definierte Endpoint den ich wählen
  logRequest('GET', '/books', req.ip, 'fetching all books');

  fs.readFile(bookJsonPath, (error, books) => {
    if (error) {
      logError(error);
    } else {
      res.send(JSON.parse(books));
    }
  });
});


/////////   Detail Ansicht!   /////////
app.get('/books/:id', (req, res) => {  // :id - Property für ein neues Objekt in params
  logRequest('GET', '/books/:id', req.ip, 'fetching book with id ' + req.params.id);

  fs.readFile(bookJsonPath, (error, booksJSON) => {
    if (error) {
      logError(error);
    } else {
      let books = JSON.parse(booksJSON);

      let idfind = req.params.id;
      let obj = books.find(item => item.id === parseInt(idfind));
      if (obj) {

        log('Found object: ' + obj.title + ' von ' + obj.author);

        res.send(obj);
      } else {
        log('No book found.');

        res.sendFile(path.join(__dirname, 'errorpages', '404.html'));
      }
    }
  });
});


/////////   BESTEHENDES BUCH BEARBEITEN   /////////
const updateBook = (id, bookData) => {
  if (!bookData) {
    bookData = {};
  }

  let booksJSON = fs.readFileSync(bookJsonPath);
  let books = JSON.parse(booksJSON);

  // Richtiges Objekt aus der Bücherliste finden und die übergebenen Parameter zuweisen!
  let indexToEdit = books.findIndex(item => item.id === parseInt(id));

  if (indexToEdit < 0) {
    log('No book to edit found');
    return {};
  }


  log('changing title from [' + books[indexToEdit].title + '] to [' + bookData.title + '] and author from [' + books[indexToEdit].author + '] to: [' + [bookData.author] + ']');

  books[indexToEdit].title = bookData.title;
  books[indexToEdit].author = bookData.author;
  books[indexToEdit].description = bookData.description;
  books[indexToEdit].isbn = bookData.isbn;

  let jsonBooks = JSON.stringify(books);
  fs.writeFileSync(bookJsonPath, jsonBooks);

  log('Successfully edited book');

  return books[indexToEdit];
};

app.patch('/books/update/:id', (req, res) => {
  logRequestWithBody('PATCH', '/books/update/:id', req.ip, 'updating book with id ' + req.params.id, req.body);

  // in RESTer: Method=PATCH, URL=http://127.0.0.1:5000/books/update/1, name=Content-Type , Value=application/json
  // in RESTER-body: JSON String angeben für die veränderung des Titels!!
  res.send(updateBook(req.params.id, req.body));

});


/////////   NEUES BUCH ANLEGEN   /////////
const addBook = (bookData) => {
  if (!bookData) {
    bookData = {};
  };

  let booksJSON = fs.readFileSync(bookJsonPath);
  let books = JSON.parse(booksJSON);

  // ?????????????????????????????????????????? //
  // EINLESEN DER ID AUS SEPARATEM JSON FILE
  let lastId = fs.readFileSync(idJsonPath);
  let readID = JSON.parse(lastId);
  let newID = readID.id + 1;

  let idForJSONFile = JSON.stringify({ id: newID });
  fs.writeFileSync(idJsonPath, idForJSONFile);

  // Daten-Objekt erstellen
  obj = {
    id: newID,
    title: bookData.title,
    author: bookData.author,
    description: bookData.description,
    isbn: bookData.isbn,
  };

  // Daten-Objekt in Bücherliste einfügen
  books.push(obj);

  log('Added new Book: [' + obj.title + '] von [' + obj.author + ']');

  // Neue Bücherliste in das JSON File schreiben lassen
  let jsonBooks = JSON.stringify(books);
  fs.writeFileSync(bookJsonPath, jsonBooks);

  return obj;
};

app.post('/books/add', (req, res) => {
  logRequestWithBody('POST', '/books/add', req.ip, 'adding new book', req.body);

  res.send(addBook(req.body));
});


/////////   BUCH ENTFERNEN   /////////
const deleteBook = (id) => {
  log('Attempting deletion of book with id ' + id);

  // synchron weil es anforderung war, mehrere user gleichzeitig zu unterstützen
  // und sich bei asynchronem read/write die callbacks gegenseitig die
  // änderungen überschreiben würden!
  let booksJSON = fs.readFileSync(bookJsonPath);
  let books = JSON.parse(booksJSON);

  let indexToDelete = books.findIndex(item => item.id === parseInt(id));

  if (indexToDelete < 0) {
    log('No book to delete found');
    return false;
  }

  books.splice(indexToDelete, 1);

  fs.writeFileSync(bookJsonPath, JSON.stringify(books));
  log('Successfully deleted');
  return true;
};

app.delete("/books/delete/:id", (req, res) => {
  logRequest('DELETE', '/books/delete/:id', req.ip, 'deleting book with id ' + req.params.id);

  deleteBook(req.params.id);
  res.send("");
});


/////////   ERROR PAGES HANDLING!   /////////
app.use('*', (req, res) => {
  logRequest('ERROR', req.ip, 'ENDPOINT NOT FOUND');
  res.status(404);
  res.sendFile(path.join(__dirname, 'errorpages', '404.html'));
});

app.listen(PORT, () => console.log(`Listening on port ${PORT} ... Press Ctrl * C to quit`));
// http://127.0.0.1:5000/
// Terminal: ipconfig   -> IPv4-Adresse: 192.168.200.7

// Server beenden STRG + C























/////////   TESTING   /////////
const testUpdateBook = () => {
  logText("testing updating books");
  updateBook(3, {
    "title": "updated Title",
    "author": "updated author",
    "description": "updated description",
    "isbn": 900001
  });
  updateBook(1, null);
  updateBook(2, undefined);
  updateBook(4, {});
  updateBook(-1, {
    "title": "updated Title -1",
    "author": "updated author -1",
    "description": "updated description -1",
    "isbn": 999999
  });
  updateBook(5, {
    "title": "updated Title",
    "author": "updated author",
  });
  updateBook(0, {
    "title": "updated Title",
    "author": "updated author",
    "description": "updated description",
    "isbn": 900000
  });
  updateBook(300, {
    "title": "updated Title 300",
    "author": "updated author 300",
    "description": "updated description 300",
    "isbn": 900001
  });
};

const testAddBook = () => {
  logText("testing adding books");

  for (let i = 1; i < 30; i++) {
    addBook({
      "title": "Title " + i,
      "author": "Author " + i,
      "description": "Description " + i,
      "isbn": i
    });
  }

  addBook({
    "title": "Title only",
    "isbn": 666
  });
  addBook({});
  addBook(null);
  addBook("cooles buch");
  addBook(-1);

};

const testDelete = () => {
  logText("testing delete function");
  deleteBook(5);
  deleteBook(5); // sollte fehl schlagen
  deleteBook(4);
  deleteBook(3);
  deleteBook(2);
  deleteBook(1);
  deleteBook(3);  // sollte fehl schlagen

  deleteBook(null); // sollte fehl schlagen
  deleteBook(-1); // sollte fehl schlagen
  deleteBook(0); // sollte fehl schlagen
};


// testDelete();
// testAddBook();
// testUpdateBook();

