// create variable to hold db | establish a conection to IndexedDB
let db; 
const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function(event){
    const db = event.target.result;
    
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

request.onsuccess = function(event){
    db = event.target.result;

    if(navigator.onLine){
        // function to upload data
        uploadTransaction();
    }
};

request.onerror = function(event){
    console.log(event.target.errorCode);
};

// this function will be executed if we attempt to submit a new transaction without internet connection
function saveRecord(record){
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const budgetObjectStore = transaction.objectStore('new_transaction');
    budgetObjectStore.add(record);
}

function uploadTransaction() {
    // opens a transaction on your db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access the object store
    const budgetObjectStore = transaction.objectStore('new_transaction');

    // get all records from store and set it to a variable
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {
        if(getAll.result.length > 0){
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json)
            .then(serverResponse => {
                if(serverResponse.message){
                    throw new Error(serverResponse)
                }
                // open one more transaction
                const transaction = db.transaction(['new_transaction'], 'readwrite');
                // acces the object store
                const budgetObjectStore = transaction.objectStore('new_transaction');
                // clear all items in the store
                budgetObjectStore.clear();

                alert('All saved transactions have been submitted');
            })
            .catch(err => console.log(err));
        }        
    };
}

window.addEventListener('online', uploadTransaction);