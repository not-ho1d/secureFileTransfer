// Convert ArrayBuffer to Base64 string
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
        iv: iv, // Initialization vector
    },
    key, // The AES key to encrypt with
    encodedMessage // The data to encrypt
);

return { encryptedData, iv }; // Return encrypted data and iv
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

async function E2EE(){
    const AESkey =await generateAESKey();
    const RSAkeypair=await generateRSAKeys();
    const publicKey = RSAkeypair.publicKey;
    const publicKeyb64=await exportPublicKey(publicKey);
    return keyData = {
        privatekey:RSAkeypair.privateKey,
        publickey:publicKeyb64
    }
}
function file_selected(){
    const file=document.getElementById("file").files[0];
    const data={
        filename:file.name,
        ext:file.type
    };
    const data_json=JSON.stringify(data);
    const reader = new FileReader();
    reader.onload = function(e){
        const blob = new Blob([e.target.result]);
        sendMessage("f1l3st4rt");
        const chunk_size = 16 * 1024;
        let offset=0;
        while(offset < blob.size){
            let chunk = blob.slice(offset,offset+chunk_size);
            offset+=chunk_size;
            console.log("sending: ",chunk)
            sendMessage(chunk);
            if(offset >= blob.size){
                console.log("howw???",blob.size,offset);
                setTimeout(()=>{
                    sendMessage(`f1l33nd`);
                    sendMessage(data_json);
                    sendMessage(`file ${file.name} sent`,true);
                },1000);
            } 
        }
    }
    reader.readAsArrayBuffer(file);
}


//peer js
const peer = new Peer();
let conn;
var AESFINALKEY;
//********display chat**************
function appendMessage(msg, isOwn = false) {
    const chatBox = document.getElementById('chatBox');
    const messageElem = document.createElement('div');
    messageElem.textContent = (isOwn ? 'You: ' : 'Peer: ') + msg;
    chatBox.appendChild(messageElem);
    chatBox.scrollTop = chatBox.scrollHeight;
}
function appendLink(msg, isOwn = false,filename) {
    const chatBox = document.getElementById('chatBox');
    const messageElem = document.createElement('a');
    const nameElem = document.createElement('label');
    const br = document.createElement("br");
    nameElem.textContent = (isOwn ? 'You: ' : 'Peer: ');
    messageElem.href=msg;
    messageElem.textContent="file attachment";
    messageElem.download=filename;
    chatBox.appendChild(nameElem);
    chatBox.appendChild(messageElem);
    chatBox.append(br);
    chatBox.scrollTop = chatBox.scrollHeight;
}
function sendMessage(msg="none",display=null){
    if(msg == "none"){
        message = document.getElementById('messageInput').value;       
        console.log(message);
        conn.send(message);
        appendMessage(message,true);
        document.getElementById('messageInput').value=null
    }else if(display == true){
        appendMessage(msg,true)
    }else{
        conn.send(msg);
    }
}

function connect(){
    conn_id=document.getElementById('connectId').value;
    conn=peer.connect(conn_id);
    document.getElementById('connectId').value=null
    var ourprivateKey;
    conn.on('open',()=>{
        console.log('connected successfully')
        E2EE().then((keyData)=>{
            sendMessage(keyData.publickey);
            ourprivateKey=keyData.privatekey;
            console.log("sended our public key: ",keyData.publickey);
        })
    });
    let file_flag=false,file_details_flag=false,keyExchangeFlag=true,AESkeyExchangeFlag=true;
    const chunks=[];
    var recievedPublicKey;

    conn.on('data',(data) =>{
        console.log("aes: ",AESkeyExchangeFlag);
        if(AESkeyExchangeFlag == true){
            console.log("unencrypted aes key",data);
            decryptWithPrivateKey(ourprivateKey,data).then((decryptedData)=>{
                AESFINALKEY=decryptedData;
                console.log("recieved aes key: ",AESFINALKEY);
            })
            AESkeyExchangeFlag=false;
        }else if(file_details_flag == true){
            const parsed = JSON.parse(data);
            const new_blob= new Blob(chunks,{type: parsed.ext});
            let url = URL.createObjectURL(new_blob);
            chunks.length=0;
            appendLink(url,false,parsed.filename);
            file_details_flag=false;
        }else if(data == "f1l33nd"){
            console.log("file_ended");
            file_flag=false;
            file_details_flag=true;
        }else if(file_flag == true){
            console.log("file flag=",file_flag);
            chunks.push(data);
            console.log("data_pushed",data);
        }else if(data == "f1l3st4rt"){
            console.log("file_incoming");
            file_flag=true;
        }else{
            appendMessage(data,false);
        }
    })
}

peer.on('open',(peer_id)=>{
    document.getElementById('peer-id-display').innerHTML=peer_id;
})

peer.on('connection',function(Incomingconn){
    conn=Incomingconn;
    conn.on('open',()=>{
        console.log('connection success');
    })
    let file_flag=false,file_details_flag=false,keyExchangeFlag=true,AESkeyExchangeFlag=false;
    const chunks=[];
    var recievedPublicKey;
    //var AESFINALKEY;
    conn.on('data',(data)=>{
        console.log("aes: ",AESkeyExchangeFlag);
        if(keyExchangeFlag == true){
            const b64publicKey = data;
            importPublicKeyFromBase64(b64publicKey).then((pkey) => {
                recievedPublicKey = pkey;
                console.log("recieved a public key: ",recievedPublicKey);
                generateAESKey().then((AESkey)=>{
                    AESFINALKEY=AESkey;
                    console.log("sended aes key",AESFINALKEY);
                    encryptWithPublicKey(recievedPublicKey,AESkey).then((encryptedData)=>{
                        sendMessage(encryptedData);
                    })
                }) 
            });
            keyExchangeFlag=false;
            AESkeyExchangeFlag=true; 
        }else if(AESkeyExchangeFlag == true){
            console.log("data here",data);
            AESkeyExchangeFlag=false;
        }else if(file_details_flag == true){
            const parsed = JSON.parse(data);
            const new_blob= new Blob(chunks,{type: parsed.ext});
            let url = URL.createObjectURL(new_blob);
            chunks.length=0;
            appendLink(url,false,parsed.filename);
            file_details_flag=false;
        }else if(data == "f1l33nd"){
            console.log("file_ended");
            file_flag=false;
            file_details_flag=true;
        }else if(file_flag == true){
            console.log("file flag=",file_flag);
            chunks.push(data);
            console.log("data_pushed",data);
        }else if(data == "f1l3st4rt"){
            console.log("file_incoming");
            file_flag=true;
        }else{
            appendMessage(data,false);
        }
    })
})


