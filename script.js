document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("fileInput");
  const passwordInput = document.getElementById("password");
  const operationSwitch = document.getElementById("operationSwitch");
  const operationLabel = document.getElementById("operationLabel");
  const form = document.querySelector("form");

  operationSwitch.addEventListener("change", () => {
    operationLabel.textContent = operationSwitch.checked ? "Decrypt" : "Encrypt";
  });

  form.addEventListener("submit", async (e) => {

    e.preventDefault();

    if (!fileInput.files.length) {
      alert("Chose file");
      return;
    }

    const file = fileInput.files[0];
    const password = passwordInput.value;
    var postUrl = document.getElementById("postUrl").value;

    if (!operationSwitch.checked) {
      await encryptFile(file, password, postUrl);
    } else {
      await decryptFile(file, password);
    }
      

  });
});

async function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

async function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

async function encryptFile(file, password, postUrl) {
  const fileData = new Uint8Array(await readFileAsArrayBuffer(file));
  const compressedData = pako.deflate(fileData, {
	  level: 7
  });
  const wordArray = CryptoJS.lib.WordArray.create(compressedData);
  const encrypted = CryptoJS.AES.encrypt(wordArray, password).toString();
  const encryptedBlob = new Blob([encrypted], { type: "text/plain" });

  if(postUrl){
    console.log('sdg');
    send(postUrl,encrypted);
  }
  else{
    saveFile(encryptedBlob, `encrypted-${file.name}`);
  }
}

async function decryptFile(file, password) {
  const fileData = await readFileAsText(file);
  const decrypted = CryptoJS.AES.decrypt(fileData, password);
  const byteArray = wordArrayToByteArray(decrypted);
  const decompressedData = pako.inflate(byteArray);
  const decryptedBlob = new Blob([decompressedData], {
    type: "application/octet-stream",
  });

  saveFile(decryptedBlob, `decrypted-${file.name}`);
}

function wordArrayToByteArray(wordArray) {
  const byteArray = new Uint8Array(wordArray.sigBytes);
  const words = wordArray.words;
  const length = byteArray.length;

  for (let i = 0; i < length; i++) {
    byteArray[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }

  return byteArray;
}

function saveFile(blob, fileName) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

function send(url, encryptedBlob){

  fetch(url, {
  method: "POST",
  body: JSON.stringify({
    payload: encryptedBlob,
  }),
  headers: {
    "Content-type": "application/json; charset=UTF-8"
  }
})
  .then((response) => response.json())
  .then((json) => console.log(json));
}
