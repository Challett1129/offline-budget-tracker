//create the variable to hold db connection
let db; 

//create connection to IndexedDB database
const request = indexedDB.open('budget', 1);

//what happens if the database version  changes
request.onupgradeneeded = function(event) {
    const db = event.target.result;

    db.createObjectStore('new_transaction', { autoIncrement: true })
};

//upon a successful request
request.onsuccess = function(event) {
    //when db is successfully created with its object store, save reference to db in global variable
    db = event.target.result;

    //check if app is online, then run function to send all local db data to api 
    uploadTransaction();
};

request.onerror = function(event) {
    //log error
    console.log(event.target.errorCode);
};

function saveRecord(record) {
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    const transactionObjectStore = transaction.objectStore('new_transaction');

    transactionObjectStore.add(record);

}

function uploadTransaction() {
    //open a transaction to the db 
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //access object storage
    const transactionObjectStore = transaction.objectStore('new_transaction');

    //get all records from store and set them to a variable
    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = function() {

        //if there was data in indexedDb's store, send it to api server
        if(getAll.result.length > 0) {
            fetch("/api/transaction", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                  Accept: "application/json, text/plain, */*",
                  "Content-Type": "application/json"
                }
              })
              .then(response => response.json())
              .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                //open another transaction
                const transaction = db.transaction(['new_transaction'], 'readwrite');

                //access budget object store
                const transactionObjectStore = transaction.objectStore('new_transaction');
                //clear all items in the store
                transactionObjectStore.clear();

                alert('All saved transactions have been submitted');
              })
              .catch(err => {
                  console.log(err);
              })
        }
    }
}

// listen for app coming back online
window.addEventListener('online', uploadTransaction);