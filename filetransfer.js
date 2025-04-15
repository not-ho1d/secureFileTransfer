const randomNumber = Math.floor(1000 + Math.random() * 9000);
console.log(randomNumber);
const sender_id =`LrnGQMV4xC9Bz87rP4N4K8k8ma${randomNumber}`
const peer = new Peer(sender_id);
const Queue = [];
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


function fileSelected(){
    const file = document.getElementById("real-file").files[0];
    const fileBluePrint={
        name:file.name,
        extension:file.type
    }
    const fileBluePrintJSON = JSON.stringify(fileBluePrint);
    const reader = new FileReader();
    reader.onload = function(e){
        const blob = new Blob([e.target.result]);
        Queue.push("SOF");
        let chunk_size = 16 * 1024;
        let offset = 0;
        while(offset <= blob.size){
            let sliced_chunk = blob.slice(offset,offset+chunk_size)
            offset+=chunk_size;
            Queue.push(sliced_chunk);
            if(offset >= blob.size){
                //setTimeout(()=>{
                    Queue.push("EOF");
                    Queue.push(fileBluePrintJSON);
                //},1000);
                console.log(Queue);
                sendData(Queue[0]);
            }
        }
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
        conn.send(sender_id.slice(sender_id.length-4,sender_id.length));
    });
    const file_chunks=[];
    let file_incoming_flag = false,file_blueprint_flag=false;
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
        }else if(file_incoming_flag == true){
            file_chunks.push(data);
        }else if(data == "SOF"){
            file_incoming_flag =true;
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
            connected_by_id=data;
            id_transfer_flag=false;
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
