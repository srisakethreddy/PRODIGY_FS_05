const DB_NAME = 'MySocialDB';
const STORE_NAME = 'mediaStore';
let db;

const openRequest = indexedDB.open(DB_NAME, 1);

openRequest.onupgradeneeded = function (e) {
  db = e.target.result;
  if (!db.objectStoreNames.contains(STORE_NAME)) {
    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
  }
};

openRequest.onsuccess = function (e) {
  db = e.target.result;
};

openRequest.onerror = function (e) {
  console.error("IndexedDB error:", e.target.errorCode);
};

function storeMedia(file, callback) {
  if (!file) return callback(null, null);

  const reader = new FileReader();
  reader.onload = function () {
    const id = Date.now().toString();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.add({ id, file: reader.result, type: file.type });

    transaction.oncomplete = () => {
      callback(id, file.type.startsWith("video") ? "video" : "image");
    };
  };
  reader.readAsDataURL(file);
}

function loadMedia(id, callback) {
  const transaction = db.transaction([STORE_NAME], "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const request = store.get(id);

  request.onsuccess = function (e) {
    if (e.target.result) {
      callback(e.target.result.file);
    } else {
      callback(null);
    }
  };
}