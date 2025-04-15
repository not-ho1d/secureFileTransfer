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
    const binaryString = atob(base64);
    const length = binaryString.length;
    const bytes = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes.buffer;
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
        <option value="none">None</option>
        <option value="aes">AES</option>
        <option value="rsa">RSA</option>
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
    <div class="section">
        ${getEncryptionOptions()}
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
// Generate AES Key
async function generateAESKey() {
    const key = await crypto.subtle.generateKey(
    {
        name: "AES-GCM",
        length: 256, // 256-bit AES key
    },
    true, // Extractable, meaning the key can be exported
    ["encrypt", "decrypt"] // Key can be used for encryption and decryption
    );
    return key;
}

// Encrypt message with AES key
async function encryptWithAES(key, message) {
    const encodedMessage = new TextEncoder().encode(message); // Convert string to ArrayBuffer
    const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialization vector for AES-GCM

    const encryptedData = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        encodedMessage
    );

    return {
        AESencryptedData: encryptedData,
        iv: iv
    };
}


// Decrypt message with AES key
async function decryptWithAES(key, encryptedData, iv) {
        const decryptedData = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv, // Initialization vector
        },
        key, // The AES key to decrypt with
        encryptedData // The data to decrypt
    );

    const decoder = new TextDecoder();
    const decryptedMessage = decoder.decode(decryptedData);
    return decryptedMessage;
}
async function aesKeyToBase64(key) {
    const rawKey = await crypto.subtle.exportKey("raw", key); // ArrayBuffer
    const base64Key = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
    return base64Key;
  }
async function base64ToAESKey(base64Key) {
    const binary = atob(base64Key); // Decode base64 to binary string
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
  
    const key = await crypto.subtle.importKey(
      "raw",
      bytes.buffer,
      { name: "AES-GCM" }, // or "AES-CBC" depending on what you're using
      true,
      ["encrypt", "decrypt"]
    );
    
    return key;
}
function areKeysEqual(key1, key2) {
    if (key1.length !== key2.length) return false;
    for (let i = 0; i < key1.length; i++) {
        if (key1[i] !== key2[i]) return false;
    }
    return true;
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

        // Initialize queue with SOF (Start of File)
        Queue.push("SOF");

        const chunk_size = 16 * 1024;  // 16KB per chunk
        let offset = 0;

        // Process chunks sequentially with async/await
        while (offset < blob.size) {
            const sliced_chunk = blob.slice(offset, offset + chunk_size);

            // Wait for the encryption to complete
            const { AESencryptedData, iv } = await encryptWithAES(AESkey, sliced_chunk);

            // Push the encrypted data and IV to the queue
            Queue.push(AESencryptedData);
            Queue.push(iv);
            console.log("Queue:", Queue);

            // If this is the last chunk, add EOF and the file blueprint info
            if (offset + chunk_size >= blob.size) {
                Queue.push("EOF");
                Queue.push(fileBluePrintJSON);
                console.log("Queue with EOF:", Queue);
            }

            // Increment the offset
            offset += chunk_size;
        }

        // Send the data (after all chunks are processed)
        sendData(Queue);
    }

    reader.readAsArrayBuffer(file);
}

let conn;

function connect(){
    const peerId = document.getElementById('peer_id').value;
    conn = peer.connect(`LrnGQMV4xC9Bz87rP4N4K8k8ma${peerId}`)
    conn.on('open',()=>{
        console.log("connection success 1");
        document.getElementById("enter_recieverid").textContent = `connected to ${peerId}`;
        document.getElementById("content").innerHTML = `
            <p>connected to ${peerId}</p>
            <p>waiting for files....</p>
        `;
        //newchange
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
    });
    const file_chunks=[];
    let file_incoming_flag = false,file_blueprint_flag=false,RSA_flag=true;
    conn.on('data',(data) =>{
        console.log("data: ",data);
        if(file_blueprint_flag == true){
            let parsedBlueprint = JSON.parse(data);
            let filename = parsedBlueprint.name;
            let filetype = parsedBlueprint.extension;
            const new_blob =new Blob(file_chunks,{type:filetype});
            const url = URL.createObjectURL(new_blob);
            const atag = document.createElement("a");
            atag.href = url;
            atag.textContent = filename;
            atag.download = filename;
            atag.className = "file-link";
            atag.target = "_blank"; 
            file_chunks.length=0;
            document.getElementById("content").appendChild(atag)
            file_blueprint_flag = false;
        }else if(data == "EOF"){
            file_incoming_flag = false;
            file_blueprint_flag=true;
            console.log("files: ",file_chunks);
        }else if(file_incoming_flag == true){
            file_chunks.push(data);
        }else if(data == "SOF"){
            file_incoming_flag =true;
        }else{
            decryptWithPrivateKey(recieverPrivateKey,data).then((decryptedData)=>{
                base64ToAESKey(decryptedData).then((decryptedAESkey)=>{
                    console.log("recieved aes: ",decryptedAESkey);
                    AESkey=decryptedAESkey;
                })
            })
        }
        conn.send("ACK");
    })
}
peer.on('open',(peer_id)=>{
    console.log("connection open");
})
let id_transfer_flag = true,connected_by_id;
peer.on('connection',function(Incomingconn){
    conn=Incomingconn;
    conn.on('open',()=>{
        console.log('connection success 2');
    })
    conn.on('data',(data)=>{
        if(id_transfer_flag == true){
            data = JSON.parse(data);
            //new change
            connected_by_id=data.senderid;
            importPublicKeyFromBase64(data.publicKey).then((decryptedpublicKey)=>{
                publicKeyRecieved = decryptedpublicKey;
            })
            id_transfer_flag=false;
            console.log("key transmission complete");
            generateAESKey().then((newAESkey)=>{
                AESkey = newAESkey;
                console.log("AES KEY : ",AESkey);
                aesKeyToBase64(AESkey).then((base64AESkey)=>{
                    encryptWithPublicKey(publicKeyRecieved,base64AESkey).then((encryptedData)=>{
                        conn.send(encryptedData);
                    })
                })
            })
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
