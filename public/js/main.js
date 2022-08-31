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

const save = $('#save');
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



////   alle Bücher angezeigt bekommen -> Endpoint   ///
fetch('/books')
  .then(response => response.json())
  .then(result => {
    // TODO: Baue eine HTML Tabelle!
    result.forEach(book => {
      overViewTable.appendChild(renderDataRow(book));
    });
    // Listenelemente klickbar machen
    let tableTR = [...overViewTable.children];

    tableTR.forEach(element => {
      element.addEventListener('click', (e) => {
        // Das objekt aus der Liste finden das mit dem geklickten element übereinstimmt!
        let thisBook = result.find(item => item.title === element.firstChild.textContent);
        showSingleBook(thisBook);
      });
    });
  })
  .catch(er => console.log(er));

// erstellen einer TableRow mit Titel, Autor, inklusive edit und delete Button
const renderDataRow = data => {
  const tr = document.createElement('tr');
  tr.appendChild(renderDataField(data.title));
  tr.appendChild(renderDataField(data.author));
  tr.appendChild(renderButtonField('edit', data.id));
  tr.appendChild(renderButtonField('delete', data.id));
  return tr;
};
// erstellen einer TableData
const renderDataField = data => {
  const td = document.createElement('td');
  td.textContent = data;
  return td;
};
// Erstellen der Buttons für delete und edit mit dem jeweiligen Function-Call
const renderButtonField = (usage, id) => {
  const td = document.createElement('td');
  const btn = document.createElement('button');
  btn.setAttribute('data-bookid', id);
  btn.textContent = usage == 'delete' ? 'löschen' : 'editieren';

  if (btn.textContent == 'editieren') {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      overView.style.display = 'none';
      detailView.style.display = 'none';
      editView.style.display = 'block';
      fillInEditView(e);
      save.addEventListener('click', () => {
        update(e);
      });
    });
  } else if (btn.textContent == 'löschen') {
    btn.addEventListener('click', e => {
      e.stopPropagation(); // EventListener erzeugt keine Kettenreaktion
      deleteBook(e);
    });
  };
  td.appendChild(btn);
  return td;
};

////   Ein einzelnes Buch angezeigt bekommen   ////
const showSingleBook = thisBook => {
  fetch('/books/' + thisBook.id)
    .then(response => response.json())
    // .then(response => response.text())
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
        overView.style.display = 'block';
        location.reload();
        detailView.style.display = 'none';
      });
    })
    .catch(er => console.log(er));
};


////   ein Buch löschen   ////
const deleteBook = e => {
  // von löschen-button-target einmal zurück mit parentNode zu td und noch einmal zu tr, davon das dritte element (edit-button) davon das hinterlegte dataset mit der bookid! 
  // => suche noch nach einer anderen Möglichkeit!!
  // let findid = e.target.parentNode.parentNode.children[2].firstChild.dataset.bookid;

  let findid = e.target.dataset.bookid;

  fetch('/books/delete/' + e.target.dataset.bookid, {
    // fetch('/books/delete/' + findid, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ findid })
  })
    .then(response => response.json())
    .then(result => {
      console.log('Daten gelöscht!');
      location.reload();
    })
    .catch(er => console.log(er));
};

////   ein Buch ändern   ////
// Zurück zur Startseite Button in Edit View
backedit.addEventListener('click', () => {
  location.reload();
  overView.style.display = 'block';
  detailView.style.display = 'none';
  editView.style.display = 'none';
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
const update = e => {
  fetch('/books/update/' + e.target.dataset.bookid, {
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
      location.reload();
      addView.style.display = 'none';
      overView.style.display = 'block';
    })
    .catch(er => console.log(er));
};


////   ein Buch hinzufügen   ////
// INFO: RELOAD FUNKTIONIERT NICHT! JSON PARSE PROBLEM?
// wechsel der View Ansicht
btnAdd.addEventListener('click', (e) => {
  overView.style.display = 'none';
  addView.style.display = 'block';
});
// Function Call
saveadd.addEventListener('click', () => {
  addBook();
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
    })
    .catch(er => console.log(er));
};
// Zurück zur Startseite mit einem Reload der Seite!
backAdd.addEventListener('click', () => {
  location.reload();
  overView.style.display = 'block';
  addView.style.display = 'none';
});