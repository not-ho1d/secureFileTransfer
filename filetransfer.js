const randomNumber = Math.floor(1000 + Math.random() * 9000);
const sender_id =`LrnGQMV4xC9Bz87rP4N4K8k8ma${randomNumber}`
const peer = new Peer(sender_id);
const Queue = [];
var recieverPublicKey;
var recieverPrivateKey;
var publicKeyRecieved;
var AESkey;
//RSA 
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), "");
    return btoa(binary);
}

// Export public key (spki format)
async function exportPublicKey(key) {
    const exported = await crypto.subtle.exportKey("spki", key);
    return arrayBufferToBase64(exported);
}

// Export private key (pkcs8 format)
async function exportPrivateKey(key) {
    const exported = await crypto.subtle.exportKey("pkcs8", key);
    return arrayBufferToBase64(exported);
}

// Generate RSA key pair and print as strings
async function generateRSAKeys() {
    const keyPair = await crypto.subtle.generateKey(
        {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256"
        },
        true,
        ["encrypt", "decrypt"]
    );

    const publicKeyStr = await exportPublicKey(keyPair.publicKey);
    const privateKeyStr = await exportPrivateKey(keyPair.privateKey);

    return keyPair;
}

async function encryptWithPublicKey(publicKey, data) {
    const encodedData = new TextEncoder().encode(data);  // Convert string to ArrayBuffer
    
    const encryptedData = await crypto.subtle.encrypt(
        {
        name: "RSA-OAEP",    // RSA encryption scheme
        },
        publicKey,            // The public key to encrypt with
        encodedData           // The data to encrypt
    );
    
return encryptedData;
}

async function decryptWithPrivateKey(privateKey, encryptedData) {
    const decryptedData = await crypto.subtle.decrypt(
        {
        name: "RSA-OAEP",  // RSA decryption scheme
        },
        privateKey,        // The private key to decrypt with
        encryptedData      // The encrypted data to decrypt
    );

    // Convert decrypted ArrayBuffer back to string
    const decodedData = new TextDecoder().decode(decryptedData);
    return decodedData;
}
function base64ToArrayBuffer(base64) {
    try {
        const binaryString = atob(base64);
        const length = binaryString.length;
        const bytes = new Uint8Array(length);

        for (let i = 0; i < length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        return bytes.buffer;
    } catch (e) {
        console.error("Invalid base64 input:", base64);
        throw new Error("Failed to decode base64 string");
    }
}

async function importPublicKeyFromBase64(base64) {
    const arrayBuffer = base64ToArrayBuffer(base64);
    const importedKey = await crypto.subtle.importKey(
        "spki", 
        arrayBuffer, 
        {
        name: "RSA-OAEP", 
        hash: "SHA-256"
        },
        true, 
        ["encrypt"]
    );
    return importedKey;
}


//GUI
function getEncryptionOptions() {
    return `
    <label for="encryption">Encryption:</label>
    <select id="encryption">
        <option value="aes">AES</option>
        <option value="rsa">RSA</option>
        <option value="rsa">RANDOM XOR cipher</option>
        <option value="rsa">RANDOM Ceaser cipher</option>
    </select>
    `;
}

function getCustomFileUploadHTML() {
    return `
    <div class="file-upload-wrapper">
        <button class="file-upload-button">Select File</button>
        <input type="file" id="real-file" onchange="showFileName(event)">
    </div>
    <div class="filename" id="filename">No file selected</div>
    `;
}

function showFileName(event) {
    const fileInput = event.target;
    const filename = fileInput.files.length ? fileInput.files[0].name : "No file selected";
    document.getElementById("filename").textContent = filename;
}

function showSend() {
    document.getElementById("content").innerHTML = `
    <div class="section" id="sender_id_hide">
        <p><strong>Sender Mode</strong></p>
        <p id="enter_senderid">Share your ID and wait for a connection.</p>
        <input type="text" id="sender-id" readonly value="${sender_id.slice(sender_id.length-4,sender_id.lenght)}">
    </div>
    <div class="section">
        ${getEncryptionOptions()}
    </div>
    <div class="section sender_section">
        <div>
        ${getCustomFileUploadHTML()}
        </div>
        <div>
        <button onclick="fileSelected()" style="margin-top:10px;width:100px;height:40px;display:flex;align-items:center;justify-content:center">Send</button>
        </div>
    </div>
    `;
}

function showReceive() {
    document.getElementById("content").innerHTML = `
    <div class="section">
        <p><strong>Receiver Mode</strong></p>
        <p id="enter_recieverid">Enter sender's ID to connect:</p>
        <input type="text" placeholder="Enter sender ID" id="peer_id">
        <button style="margin-top:10px;" onclick="connect()">Connect</button>
    </div>
    `;
}
function sendData(data){
    if(conn && conn.open){
        conn.send(data);
    }else{
        console.error("connection not open");
    }
}
//AES
// Function to generate a 256-bit AES key (AES-GCM)
async function generateAESKey() {
    return await crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256, // AES-256
        },
        true, // extractable
        ["encrypt", "decrypt"] // Use key for encrypt and decrypt
    );
}

// Function to export AES key to Base64
async function exportAESKeyToBase64(key) {
    const rawKey = await crypto.subtle.exportKey("raw", key);
    return arrayBufferToBase64(rawKey);
}

// Function to import AES key from Base64
async function importAESKeyFromBase64(base64Key) {
    const rawKey = decodeBase64ToArrayBuffer(base64Key);
    return await crypto.subtle.importKey(
        "raw",
        rawKey,
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"]
    );
}

// AES Encryption (returns ciphertext and IV as Base64 strings)
async function encryptWithAES(key, message) {
    const encodedMessage = new TextEncoder().encode(message);
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

    const encryptedData = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        encodedMessage
    );

    return {
        ciphertext: arrayBufferToBase64(encryptedData),
        iv: arrayBufferToBase64(iv.buffer),
    };
}

// AES Decryption (using Base64 encoded ciphertext and IV)
async function decryptWithAES(key, base64Ciphertext, base64IV) {
    const encryptedData = decodeBase64ToArrayBuffer(base64Ciphertext);
    const iv = new Uint8Array(decodeBase64ToArrayBuffer(base64IV));

    const decryptedData = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encryptedData
    );

    return new TextDecoder().decode(decryptedData);
}

// Utility to convert ArrayBuffer to Base64 (for network transfer)
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), "");
    return btoa(binary);
}

// Utility to convert Base64 back to ArrayBuffer
function decodeBase64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

async function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
  
      reader.onloadend = () => {
        resolve(reader.result.split(',')[1]); // removes "data:*/*;base64,"
      };
  
      reader.onerror = reject;
  
      reader.readAsDataURL(blob); // reads blob as base64 data URL
    });
  }

async function base64ToBlob(base64, mimeType = "") {
    const byteCharacters = atob(base64);
    const byteArrays = [];
  
    for (let i = 0; i < byteCharacters.length; i += 512) {
      const chunk = byteCharacters.slice(i, i + 512);
      const byteNumbers = new Array(chunk.length);
  
      for (let j = 0; j < chunk.length; j++) {
        byteNumbers[j] = chunk.charCodeAt(j);
      }
  
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
  
    return new Blob(byteArrays, { type: mimeType });
}
  

async function fileSelected() {
    const file = document.getElementById("real-file").files[0];
    const reader = new FileReader();

    let fileBluePrint = {
        name: file.name,
        extension: file.type,
    };
    const fileBluePrintJSON = JSON.stringify(fileBluePrint);

    reader.onload = async function(e) {
        const blob = new Blob([e.target.result]);
        Queue.push("SOF");
        const chunk_size = 16 * 1024; 
        let offset = 0;

        while (offset < blob.size){
            let sliced_chunk = blob.slice(offset,offset+chunk_size);
            const sliced_chunkB64 =await blobToBase64(sliced_chunk);
            const {ciphertext,iv} = await encryptWithAES(AESkey,sliced_chunkB64);
            let file_chunkJSON = {
                data:ciphertext,
                iv:iv
            };
            Queue.push(JSON.stringify(file_chunkJSON));
            if (offset + chunk_size >= blob.size) {
                Queue.push("EOF");
                Queue.push(fileBluePrintJSON);
            }
            offset += chunk_size;
        }
        sendData(Queue[0]);
    }
    reader.readAsArrayBuffer(file);
}

async function getDataBlob(file_chunks,fileDetails){
    let decryptedDataList = [];
    for(let JSONencodedfilechunk of file_chunks){
        let encJSON = JSON.parse(JSONencodedfilechunk);
        const decryptedData = await decryptWithAES(AESkey,encJSON.data,encJSON.iv);
        const decryptedDataBlob =await base64ToBlob(decryptedData,'');
        decryptedDataList.push(decryptedDataBlob);
    }
    return new Blob(decryptedDataList,{type:fileDetails.extension});
}


let conn;

function connect(){
    const peerId = document.getElementById('peer_id').value;
    conn = peer.connect(`LrnGQMV4xC9Bz87rP4N4K8k8ma${peerId}`)
    conn.on('open',()=>{
        //when connection opens generates RSA key and send peer id
        generateRSAKeys().then((keyPair)=>{
            exportPublicKey(keyPair.publicKey).then((base64publicKey)=>{
                const new_data={
                    senderid:sender_id.slice(sender_id.length-4,sender_id.length),
                    publicKey:base64publicKey
                }
                let new_dataJSON=JSON.stringify(new_data)
                conn.send(new_dataJSON)
            })
            recieverPublicKey = keyPair.publicKey;
            recieverPrivateKey = keyPair.privateKey;
        })
        document.getElementById("enter_recieverid").textContent = `connected to ${peerId}`;
        document.getElementById("content").innerHTML = `
            <p>connected to ${peerId}</p>
            <p>waiting for files....</p>
        `;
    });
    let file_incoming = false,file_blueprint_flag=false;
    let filechunks = [];
    conn.on('data',(data) =>{
        if(file_blueprint_flag == true){
            let fileDetails = JSON.parse(data);
            getDataBlob(file_chunks,fileDetails).then((blob)=>{
                const url = URL.createObjectURL(blob);
                const atag = document.createElement("a");
                atag.href = url;
                atag.textContent = fileDetails.name;
                atag.download = fileDetails.name;
                atag.className = "file-link";
                atag.target = "_blank"; 
                document.getElementById("content").appendChild(atag);
                filechunks.length=0;
                file_blueprint_flag=false;
                conn.send("ACK");
            })
        }else if(data == "EOF"){
            file_blueprint_flag=true;
            file_incoming=false;
            conn.send("ACK");
        }else if(data == "SOF"){
            file_incoming = true;
            conn.send("ACK");
        }else if(file_incoming == true){
            file_chunks.push(data);
            conn.send("ACK");
        }else{
            decryptWithPrivateKey(recieverPrivateKey,data).then((decryptedData)=>{
                importAESKeyFromBase64(decryptedData).then((rawAESKEY)=>{
                    AESkey =rawAESKEY;
                })
            })
        }
    })
}
peer.on('open',(peer_id)=>{
    console.log("connection open");
})


let RESexchange = true,connected_by_id;
let file_incoming = false;
let file_chunks = [];
peer.on('connection',function(Incomingconn){
    conn=Incomingconn;
    conn.on('open',()=>{
        console.log('connection success 2');
    })
    conn.on('data',(data)=>{
        if(RESexchange == true){
            let keyData = JSON.parse(data);
            connected_by_id = keyData.sender_id;
            importPublicKeyFromBase64(keyData.publicKey).then((decryptedpublicKey)=>{
                publicKeyRecieved = decryptedpublicKey;
                generateAESKey().then((newAESkey)=>{
                    AESkey=newAESkey;
                    exportAESKeyToBase64(AESkey).then((AESkeyB64)=>{
                        encryptWithPublicKey(publicKeyRecieved,AESkeyB64).then((encryptedAESkey)=>{
                            conn.send(encryptedAESkey);
                        })
                    })
                })
            })
            RESexchange = false;
        }else if(data == "ACK"){
            Queue.shift();
            if(Queue.length != 0){
                conn.send(Queue[0]);
            }
        }
        document.getElementById("content").innerHTML=`
            <div class="section" id="sender_id_hide">
                <p><strong>Sender Mode</strong></p>
                <p id="enter_senderid">connected by ${connected_by_id}</p>
            </div>
            <div class="section">
                ${getEncryptionOptions()}
            </div>
            <div class="section sender_section">
                <div>
                ${getCustomFileUploadHTML()}
                </div>
                <div>
                <button onclick="fileSelected()" style="margin-top:10px;width:100px;height:40px;display:flex;align-items:center;justify-content:center">Send</button>
                </div>
            </div>
        `;
    })
})