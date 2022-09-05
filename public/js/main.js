const $ = data => document.querySelector(data);

const overView = $('#initialView');
const addView = $('#addView');
const detailView = $('#detailView');
const editView = $('#editView');
const overViewTable = $('#initialView table tbody');

const btnAdd = $('#addButton');
const back = $('#backBtn');
const backedit = $('#backBtn2');
const backAdd = $('#backBtnAdd');

const saveEdit = $('#save');
const saveadd = $('#saveAdd');

let titleContent = $("#titleContent");
let authorContent = $("#authorContent");
let isbnContent = $("#isbnContent");
let descript = $("#descriptionContent");

let titleEdit = $('#titleEdit');
let authorEdit = $('#authorEdit');
let isbnEdit = $('#isbnEdit');
let textEdit = $('#textEdit');

let newTitle = $('#newTitle');
let newAuthor = $('#newAuthor');
let newISBN = $('#newISBN');
let newDescription = $('#newDescription');

let tbody = $('#tbody');


// PURGE FUNCTION //
// const removeTags = (str) => {
//   if ((str === null) || (str === "")) return false;
//   else {
//     str = str.toString();
//     return str.replace(/(<([^>]+)>)/ig, '');
//   }
// };

let editId;


const clearAndRefillTableBody = () => {
  ////   alle Bücher angezeigt bekommen -> Endpoint   ///
  fetch('/books')
    .then(response => response.json())
    .then(result => {

      tbody.innerHTML = '';


      // TODO: Baue eine HTML Tabelle!
      result.forEach(book => {
        let row = renderDataRow(book);

        overViewTable.appendChild(row);

        row.addEventListener('click', (e) => {
          // Das objekt aus der Liste finden das mit dem geklickten element übereinstimmt!
          let thisBook = result.find(item => item.title === row.firstChild.textContent);
          showSingleBook(thisBook);
        });
      });

    })
    .catch(er => console.log(er));
};


clearAndRefillTableBody();

// erstellen einer TableRow mit Titel, Autor, inklusive edit und delete Button
const renderDataRow = data => {
  const tr = document.createElement('tr');
  tr.appendChild(renderDataField(data.title));
  tr.appendChild(renderDataField(data.author));
  tr.appendChild(renderEditButtonField(data.id));
  tr.appendChild(renderDeleteButtonField(data.id));
  tr.classList.add('lineDown');
  return tr;
};

// erstellen einer TableData
const renderDataField = data => {
  const td = document.createElement('td');
  td.textContent = data;
  return td;
};

const renderEditButtonField = (id) => {
  const td = document.createElement('td');
  const editBtn = document.createElement('button');
  editBtn.setAttribute('data-bookid', id);
  editBtn.setAttribute('class', 'edit-delete');

  editBtn.textContent = '';
  // btn.textContent = 'editieren';
  // btn.innerHTML = '<img alt=\"Bearbeiten\" src=\"./img/edit.svg\" width=\"20px\">';
  editBtn.style.backgroundImage = "url('./img/edit.svg')";

  editBtn.addEventListener('click', e => {
    console.log('BLAH');
    e.stopPropagation();
    fillInEditView(e);
    editId = e.target.dataset.bookid;
    overView.style.display = 'none';
    editView.style.display = 'block';

  });
  td.appendChild(editBtn);
  return td;
};

const renderDeleteButtonField = (id) => {
  const td = document.createElement('td');
  const btn = document.createElement('button');
  btn.setAttribute('data-bookid', id);
  btn.setAttribute('class', 'edit-delete');

  btn.textContent = '';
  // btn.textContent = 'löschen';
  // btn.innerHTML = '<img alt=\"Löschen\" src=\"./img/delete.svg\" width=\"20px\">';
  btn.style.backgroundImage = "url('./img/delete.svg')";

  btn.addEventListener('click', e => {
    e.stopPropagation(); // EventListener erzeugt keine Kettenreaktion
    deleteBook(e);
  });
  td.appendChild(btn);
  return td;
};

////   Ein einzelnes Buch angezeigt bekommen   ////
const showSingleBook = thisBook => {

  fetch('/books/' + thisBook.id)
    .then(response => response.json())
    .then(result => {

      // ausblenden der "Startseite" und einblenden der Detail-Ansicht!
      overView.style.display = 'none';
      detailView.style.display = 'block';

      // übergabe des Objekt-Inhalts der einzelnen Bereiche
      titleContent.textContent = thisBook.title;
      authorContent.textContent = thisBook.author;
      isbnContent.textContent = thisBook.isbn;
      descript.textContent = thisBook.description;

      // Zurück zur Startseite
      back.addEventListener('click', () => {
        clearAndRefillTableBody();
        overView.style.display = 'block';
        detailView.style.display = 'none';
      });
    })
    .catch(er => console.log(er));
};


////   ein Buch löschen   ////
const deleteBook = e => {
  let findid = e.target.dataset.bookid;

  fetch('/books/delete/' + e.target.dataset.bookid, {
    // fetch('/books/delete/' + findid, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ findid })
  })
    // text() statt json(), da kein json kommt
    .then(response => response.text())
    .then(result => {
      console.log('Daten gelöscht!');
      clearAndRefillTableBody();
    })
    .catch(er => console.log(er));
};

////   ein Buch ändern   ////
// Zurück zur Startseite Button in Edit View
backedit.addEventListener('click', () => {
  clearAndRefillTableBody();
  overView.style.display = 'block';
  editView.style.display = 'none';
});

// Speichert die aktuellen Änderungen und geht zurück zur Startseite
saveEdit.addEventListener('click', () => {
  update();
  clearAndRefillTableBody();
  editView.style.display = 'none';
  overView.style.display = 'block';
});

// Übernimmt die Daten aus dem Buchobjekt und füllt sie im Formular automatisch aus!
const fillInEditView = e => {
  fetch('/books/' + e.target.dataset.bookid)
    .then(response => response.json())
    .then(result => {

      titleEdit.value = result.title;
      authorEdit.value = result.author;
      isbnEdit.value = result.isbn;
      textEdit.value = result.description;
    })
    .catch(er => console.log(er));
};

////   Ein Buch überarbeiten   ///
const update = () => {
  // removeTags(titleEdit.value);
  // removeTags(authorEdit.value);
  // removeTags(textEdit.value);
  // removeTags(isbnEdit.value);

  console.debug('editId: ' + editId);

  fetch('/books/update/' + editId, {
    method: 'PATCH',
    body: JSON.stringify({
      title: titleEdit.value,
      author: authorEdit.value,
      description: textEdit.value,
      isbn: isbnEdit.value
    }),
    headers: {
      'Content-Type': 'application/json' // Bindestriche sind in Variablen nicht möglich deswegen muss es in '' geschrieben werden
    }
  })
    .then(response => response.json())
    .then(result => {
      console.log('Das Buch wurde geändert');
      clearAndRefillTableBody();
    })
    .catch(er => console.log(er));
};


////   ein Buch hinzufügen   ////
btnAdd.addEventListener('click', (e) => {
  overView.style.display = 'none';
  addView.style.display = 'block';
});
// Function Call
saveadd.addEventListener('click', () => {
  addBook();
  addView.style.display = 'none';
  overView.style.display = 'block';
});

const addBook = () => {
  fetch('/books/add', {
    method: 'POST',
    body: JSON.stringify({
      title: newTitle.value,
      author: newAuthor.value,
      description: newDescription.value,
      isbn: newISBN.value
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(response => response.json())
    .then(result => {
      console.log('Das Buch wurde hinzugefügt');
      clearAndRefillTableBody();
    })
    .catch(er => console.log(er));
};
// Zurück zur Startseite!
backAdd.addEventListener('click', () => {
  addView.style.display = 'none';
  overView.style.display = 'block';
});