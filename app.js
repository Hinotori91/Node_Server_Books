require('dotenv').config(); // Einbinden und die config aufrufen das dotenv verwendet werden kann für die umgebungsvariablen
const fs = require('fs');

const path = require('path');
const PORT = process.env.PORT;  // process-objekt gibt mir alles aus (welcher rechner, welches betriebssystem)
const exp = require('constants');
const express = require("express");
const { json } = require('express');
const { log } = require('console');
const { AsyncLocalStorage } = require('async_hooks');
const app = express(); // erstellt einen Server!


// Builds proper path depending on OS
const staticpath = path.join(__dirname, 'public'); // erstellt mir einen Pfad zu meiner Index.html

let jsonPath = path.join(__dirname, 'json', "books.json");
let idPath = path.join(__dirname, 'json', "lastid.json");
let logPath = path.join(__dirname, 'json', "log.log");

let timestamp = new Date();


///   ROUTINGS   ///
// API ENDPOINTS! - sind die URLs die ich selbst definiere

app.use(express.json());  // jetzt weiß der Server das er mit JSON Files arbeiten muss!
app.use(express.static(staticpath)); // Link zur index html seite


/////////   ALLE BÜCHER ANZEIGEN - STARTSEITE   /////////
app.get('/books', (req, res) => {     // /books ist der selbst definierte Endpoint den ich wählen
  fs.readFile(jsonPath, (error, books) => {
    if (error) {
      logdata = 'Client IP-Adress: ' + req.ip + '\n  Date: ' + timestamp + '\n  Error: ' + error + '\n\n';
      console.log(error);
    } else {
      let booksList = JSON.parse(books);

      logdata = 'Client IP-Adress: ' + req.ip + '\n  Date: ' + timestamp + '\n  Using: /books\n\n';
      // res.send(JSON.parse(books));
      res.send(booksList);
    }

    fs.appendFile(logPath, logdata, (err) => {
      if (err) throw err;
      console.log('The file has been saved!');
    });
  });



});

/////////   Detail Ansicht!   /////////
app.get('/books/:id', (req, res) => {  // :id - Property für ein neues Objekt in params
  fs.readFile(jsonPath, (error, booksJSON) => {
    if (error) {
      logdata = 'Client IP-Adress: ' + req.ip + '\n  Date: ' + timestamp + '\n  Error: ' + error + '\n\n';
      console.log(error);
    } else {
      let books = JSON.parse(booksJSON);

      let idfind = req.params.id;
      let obj = books.find(item => item.id === parseInt(idfind));
      if (obj) {

        logdata = 'Client IP-Adress: ' + req.ip + '\n  Date: ' + timestamp + '\n  Using: /books/' + idfind + '\n  Object: ' + obj.title + ' von ' + obj.author + '\n\n';

        res.send(obj);
      } else {
        logdata = 'Client IP-Adress: ' + req.ip + '\n  Date: ' + timestamp + '\n  Error: 404\n\n';

        res.sendFile(path.join(__dirname, 'errorpages', '404.html'));
      }
    }

    fs.appendFile(logPath, logdata, (err) => {
      if (err) throw err;
      console.log('The file has been saved!');
    });
  });
});

/////////   BESTEHENDES BUCH BEARBEITEN   /////////
app.patch('/books/update/:id', (req, res) => {
  fs.readFile(jsonPath, (error, booksJSON) => {
    if (error) {
      logdata = 'Client IP-Adress: ' + req.ip + '\n  Date: ' + timestamp + '\n  Error: ' + error + '\n\n';
      console.log(error);
    } else {
      let books = JSON.parse(booksJSON);

      // Richtiges Objekt aus der Bücherliste finden und die übergebenen Parameter zuweisen!
      let idfind = req.params.id;
      let obj = books.findIndex(item => item.id === parseInt(idfind));

      console.log(idfind);
      console.log(books[obj]);

      books[obj].title = req.body.title;
      books[obj].author = req.body.author;
      books[obj].description = req.body.description;
      books[obj].isbn = req.body.isbn;

      logdata = 'Client IP-Adress: ' + req.ip + '\n  Date: ' + timestamp + '\n  Using: /books/update/' + books[obj].id + '\n  changing in: ' + [req.body.title, books[obj].author] + '\n\n';


      let jsonBooks = JSON.stringify(books);
      fs.writeFile(jsonPath, jsonBooks, (err) => {
        if (err) {
          console.log(err);
        } else {
          res.send(books[obj]);
        }
      });
    }

    // in RESTer: Method=PATCH, URL=http://127.0.0.1:5000/books/update/1, name=Content-Type , Value=application/json
    // in RESTER-body: JSON String angeben für die veränderung des Titels!!

    fs.appendFile(logPath, logdata, (err) => {
      if (err) throw err;
      console.log('The file has been saved!');
    });
  });
});


/////////   NEUES BUCH ANLEGEN   /////////
app.post('/books/add', (req, res) => {
  fs.readFile(jsonPath, (error, booksJSON) => {
    if (error) {
      logdata = 'Client IP-Adress: ' + req.ip + '\n  Date: ' + timestamp + '\n  Error: ' + error + '\n\n';
      console.log(error);
    } else {
      let books = JSON.parse(booksJSON);


      // ?????????????????????????????????????????? //
      // EINLESEN DER ID AUS SEPARATEM JSON FILE
      fs.readFile(idPath, (error, test) => {
        if (error) {
          console.log(error);
        } else {

          let readID = JSON.parse(test);
          let newID = readID.id + 1;
          // Daten-Objekt erstellen
          obj = {
            id: newID,
            title: req.body.title,
            author: req.body.author,
            description: req.body.description,
            isbn: req.body.isbn,
          };

          // Daten-Objekt in Bücherliste einfügen
          books.push(obj);

          logdata = 'Client IP-Adress: ' + req.ip + '\n  Date: ' + timestamp + '\n  Using: /books/add \n  Added new Book: ' + obj.title + ' von ' + obj.author + '\n\n';

          // Neue Bücherliste in das JSON File schreiben lassen
          let jsonBooks = JSON.stringify(books);
          fs.writeFile(jsonPath, jsonBooks, (err) => {
            if (err) {
              console.log(err);
            } else {
              res.send(obj);
            }
          });

          let idForJSONFile = JSON.stringify({ id: obj.id });
          fs.writeFile(idPath, idForJSONFile, (err) => {
            if (err) {
              console.log(err);
            } else {
              // res.send(id);
              // res.send(newID);
              console.log('neue id wurde gesetzt');
            }
          });
        }
        fs.appendFile(logPath, logdata, (err) => {
          if (err) throw err;
          console.log('The file has been saved!');
        });

      });
    }
  });
});


/////////   BUCH ENTFERNEN   /////////
app.delete("/books/delete/:id", (req, res) => {
  fs.readFile(jsonPath, (error, booksJSON) => {
    if (error) {
      logdata = 'Client IP-Adress: ' + req.ip + '\n  Error: ' + error + '\n\n';
      console.log(error);
    } else {
      let books = JSON.parse(booksJSON);

      let idfind = JSON.parse(req.body.findid);
      let obj = books.find(item => item.id === parseInt(idfind));

      let deletedbook = books.splice(books.indexOf(obj), 1);
      console.log(deletedbook);

      logdata = 'Client IP-Adress: ' + req.ip + '\n  Using: /books/delete \n  deleted: ' + [deletedbook[0].title, deletedbook[0].author] + '\n\n';

      let jsonBooks = JSON.stringify(books);
      fs.writeFile(jsonPath, jsonBooks, (err) => {
        if (err) {
          console.log(err);
        } else {
          res.send({ deletedbook });
        }
      });
    }

    fs.appendFile(logPath, logdata, (err) => {
      if (err) throw err;
      console.log('The file has been saved!');
    });
  });
});


/////////   ERROR PAGES HANDLING!   /////////
app.use('*', (req, res) => {
  res.status(404);
  res.sendFile(path.join(__dirname, 'errorpages', '404.html'));
});

app.listen(PORT, () => console.log(`Listening on port ${PORT} ... Press Ctrl * C to quit`));
// http://127.0.0.1:5000/
// Terminal: ipconfig   -> IPv4-Adresse: 192.168.200.7

// Server beenden STRG + C