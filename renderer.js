//套件導入
const { ipcRenderer } = require('electron');
const { Client } = require('ssh2');
const { setInterval } = require('timers');
const {v4:uuidv4} = require('uuid');

const crypto = require('crypto')
const mariadb = require('mariadb');
const cheerio = require('cheerio');
const fs = require('fs');
const { count } = require('console');
const path = require('path');
const conn = new Client();
//bool
var isOpen = false;
var isLogin = false;
var isConnect = false;

//empty value
var username = "";
let env;
var lastnum_news;

//buttons
var menu_bt; 
var home_bt; 
var login_bt; 
var website_bt; 
var codemanage_bt;
var admin_bt;
var newsupdate_bt;
var gallery_bt;
var menu;
//button array
var buttons;
var hidden_bt_array;

ipcRenderer.on('env',(event,received)=>{
    env = received;
})

window.onload = function() {
    const min_bt = document.getElementById('control-min');
    const max_bt = document.getElementById('control-max');
    const close_bt = document.getElementById('control-close');

    menu = document.getElementById('main-container')
    menu_bt = document.getElementById('menu-bt');
    home_bt = document.getElementById('home-bt');
    login_bt = document.getElementById('login-bt');
    website_bt = document.getElementById('website-bt');
    codemanage_bt = document.getElementById('codemanage-bt');
    admin_bt = document.getElementById('admin-bt');
    newsupdate_bt = document.getElementById('newsupdate-bt');
    gallery_bt = document.getElementById('gallery-bt');

    buttons = [menu_bt , home_bt , login_bt , website_bt , codemanage_bt , admin_bt , newsupdate_bt,gallery_bt];
    hidden_bt_array = [admin_bt , codemanage_bt , newsupdate_bt , website_bt,gallery_bt];

    console.log("load renderer")

    loadPage('home');

    min_bt.addEventListener('click',function(){
        ipcRenderer.send('minimize-window');
        console.log("bt1 clicked")
    });

    max_bt.addEventListener('click',function(){
        ipcRenderer.send('maximize-window');
    });

    close_bt.addEventListener('click',function(){
        ipcRenderer.send('close-window');
    });

    menu_bt.addEventListener('click',function(){
        if(isOpen){
            closeMenu();
        }
        else{
            buttons.forEach(bt => {
                bt.style.letterSpacing = "2px";
            })

            menu.style.transition = ".2s ease-in-out";
            menu.style.gridTemplateColumns = "270px 100%";
            isOpen = true;
        }
    })

    login_bt.addEventListener('click',function(){
        if(!isLogin)
            loadPage('login');
        else
            logout_init();
    });

    home_bt.addEventListener('click',function(){
        loadPage('home');
    })

    website_bt.addEventListener('click',function(){
        loadPage('website');
    })

    codemanage_bt.addEventListener('click',function(){
        loadPage('codemanage');
    })

    newsupdate_bt.addEventListener('click',function(){
        loadPage('newsupdate');
    })

    admin_bt.addEventListener('click',function(){
        loadPage('ssh');
    })

    gallery_bt.addEventListener('click',function(){
        loadPage('gallery');
    })

}

function closeMenu(){

    buttons.forEach(bt => {
        bt.style.letterSpacing = "1000px";
    })

    menu.style.transition = ".2s ease-in-out";
    menu.style.gridTemplateColumns = "70px 100%";
    isOpen = false;
}

function sql_connect(){
    const json = JSON.stringify(env);
    const dbdata = JSON.parse(json);

    return pool = mariadb.createPool({
        host: dbdata.DB_HOST,
        user: dbdata.DB_USER,
        password: dbdata.DB_PASSWORD,
        port: 3306,
        database: dbdata.DB_NAME
    });
}

function loadPage(names){

    closeMenu();

    fetch(path.join(__dirname,`Pages/${names}/${names}.html`))
        .then(response => response.text())
        .then(data => {
            document.getElementById('main-page').innerHTML = data;

            switch(names){
                case 'login':
                    login_init();
                    break;

                case 'home':
                    home_init();
                    break;

                case 'website':
                    website_init();
                    break;

                case 'codemanage':
                    codemanage_init();
                    break;
                    
                case 'newsupdate':
                    newsupdate_init();
                    break;
                    
                case 'ssh':
                    admin_init();
                    break;
                case 'gallery':
                    gallery_init();
                    break;
            }

            document.getElementById('main-page').scrollTop = 0;
        })
        .catch(err => {
            alert(err)
        })
}

function home_init(){
    if(isLogin){
        var time = new Date();
        document.getElementById('user-name').innerText = username;
        document.getElementById('timenow').innerText = time.getFullYear() + "." + (time.getMonth()+1) + "." + time.getDate();
    }
    else{
        document.getElementById('user-name').innerText = "請登入";
    }
}

function login_init(){

    document.getElementById('loginForm').addEventListener('submit',function(event){
        event.preventDefault();

        username = document.getElementById('usr').value;
        const password = document.getElementById('pwd').value;

        let hash = crypto.createHash('sha256');
        hash.update(password);
        
        let pool = sql_connect();
        
        pool.getConnection()
            .then(conn => {
                return conn.query('SELECT * FROM accountData WHERE Username = ? AND Password = ?', [username, hash.digest('hex')]);
            })
            .then(rows => {
                if(rows.length > 0){
                    alert("歡迎登入");
                    isLogin = true;
                    hidden_bt_array.forEach(bt => {
                        bt.hidden = false;
                    })
                    loadPage('home');
                }
                else{
                    alert("帳號或密碼錯誤");
                }
            })
            .catch(err => {
                console.log(err);
            });
    })
}

function logout_init(){

    if(confirm("確定要登出嗎?")){
        isLogin = false;
        
        hidden_bt_array.forEach(bt => {
            bt.hidden = true;
        })

        alert("登出成功!");
        loadPage('home');
    }
}

function admin_init(){
    const json = JSON.stringify(env);
    const dbdata = JSON.parse(json);

    if(!isConnect){
        conn.on('ready',() => {
            updateTemp();
            cpuusage();
            ram();
            systemid();
            ipconfig();
            netsend();
            
            setInterval(updateTemp,5000);
            setInterval(cpuusage,5000);
            setInterval(ram,5000);
            setInterval(systemid,5000);
            setInterval(ipconfig,5000);
            setInterval(netsend,5000);
            isConnect = true;
    
        }).connect({
            host: dbdata.SERVER_HOST,
            username: dbdata.SERVER_USER,
            password: dbdata.SERVER_PASSWORD,
            port: 22,
            privateKey: fs.readFileSync('C:\\Users\\SHALI\\.ssh\\id_rsa')
        });
    
        conn.on('error',(err) => {
            alert('出現錯誤，請聯繫開發人員');
            console.error('SSH connection error:',err);
            loadPage('home');
        })
    }
}

function updateTemp() {
    conn.exec('sensors', (err, stream) => {
        if (err) throw err;
        let output = '';
        stream.on('data', (data) => {
            output += data.toString();
        }).on('close', () => {
            const tempMatch = output.match(/temp1:\s+\+([\d\.]+)°C/);
            if (tempMatch) {
                const temperature = tempMatch[1];
                document.getElementById('temp').innerText = `Temperature: ${temperature}°C`;
                document.getElementById('status-icon').style.color = 'Green';
            } else {
                document.getElementById('temp').innerText = 'Temperature: N/A';
            }
        }).stderr.on('data', (data) => {
            console.error('STDERR: ' + data);
        });
    });
}

function cpuusage() {
    conn.exec('mpstat', (err, stream) => {
        if (err) throw err;
        let output = '';
        stream.on('data', (data) => {
            output += data.toString();
        }).on('close', () => {
            const deviceMatch = output.match(/Linux\s+([\d\.\-a-zA-Z]+)\s+\(([\w\-]+)\)/);
            const cpuMatch = output.match(/all\s+\d+\.\d+\s+\d+\.\d+\s+\d+\.\d+\s+\d+\.\d+\s+(\d+\.\d+)/);
            if(deviceMatch){
                const deviceName = `${deviceMatch[1]}(${deviceMatch[2]})`;
                document.getElementById('device').innerText = `Device: ${deviceName}`;
            }
            if (cpuMatch) {
                const cpuUsage = cpuMatch[1];
                document.getElementById('cpuuse').innerText = `CPU Usage: ${cpuUsage}%`;
            } else {
                document.getElementById('cpuuse').innerText = 'CPU Usage: N/A';
            }
        }).stderr.on('data', (data) => {
            console.error('STDERR: ' + data);
        });
    });
}

function ram(){
    conn.exec('free -h',(err,stream) => {
        if (err) throw err;
        let output = '';
        stream.on('data', (data) => {
            output += data.toString();
        }).on('close', () => {
            const match = output.match(/Mem:\s+(\S+)\s+(\S+)/);
            if (match) {
                const total = match[1];
                const used = match[2];

                document.getElementById('ram').innerText = `Total Memory: ${total}\nUsed Memory: ${used}`;
            } else {
                console.error('Unable to parse memory information');
            }
        }).stderr.on('data',(data) => {
            console.error('STDERR:' + data);
        });
    })
}

function systemid(){
    conn.exec('lsb_release -a',(err,stream) => {
        if (err) throw err;
        let output = '';
        stream.on('data', (data) => {
            output += data.toString();
        }).on('close', () => {
            const match = output.match(/Description:\s+(\S+)\s+(\S+)\s+(\S+)/);
            if (match) {
                const name = match[1]+match[2]+match[3];

                document.getElementById('system').innerText = `System: ${name}`;
            } else {
                console.error('Unable to parse System information');
            }
        }).stderr.on('data',(data) => {
            console.error('STDERR:' + data);
        });
    })
}

function ipconfig(){
    conn.exec('ifconfig',(err,stream) => {
        if (err) throw err;
        let output = '';
        stream.on('data', (data) => {
            output += data.toString();
        }).on('close', () => {
            const ip = output.match(/inet\s+(\S+)/);
            const mask = output.match(/netmask\s+(\S+)/);
            const cast = output.match(/broadcast\s+(\S+)/);
            if (ip) {

                document.getElementById('ipconfig').innerText = `IP: ${ip[1]} \n Mask: ${mask[1]} \n Cast: ${cast[1]}`;
            } else {
                console.error('Unable to parse Internet information');
            }
        }).stderr.on('data',(data) => {
            console.error('STDERR:' + data);
        });
    })
}

function netsend(){
    conn.exec('ifstat -i eth0 1 1',(err,stream) => {
        if (err) throw err;
        let output = '';
        stream.on('data', (data) => {
            output += data.toString();
        }).on('close', () => {
            const match = output.match(/^\s*eth0\s+KB\/s in\s+KB\/s out\s+(\S+)\s+(\S+)/m);
            if (match) {
                const received = match[1];
                const transmitted = match[2];

                document.getElementById('internet').innerText = `Received: ${received} KB/s\nTransmitted: ${transmitted} KB/s`;
            } else {
                console.error('Unable to parse network statistics');
            }
        }).stderr.on('data',(data) => {
            console.error('STDERR:' + data);
        });
    })
}

function website_init(){
    var tablediv = document.querySelector('#page-content');

    let pool = sql_connect();

    pool.getConnection()
    .then(conn => {
        return conn.query('SELECT UserIP FROM UserLoginData;');
    })
    .then(rows => {
        document.getElementById('visitor').innerText = `Total Vistor: ${rows.length}`;
    })

    pool.getConnection()
    .then(conn => {
        return conn.query('SELECT * FROM PageStatus')
    })
    .then(rows => {

        rows.forEach(row => {
            var content_div = document.createElement('tr');

            if(row.ID=='999'){
                if(row.Status==1){
                    document.getElementById('status-icon').style.color = "Green";
                }
                else{
                    document.getElementById('status-icon').style.color = "Red";
                }
            }

            var ID = document.createElement('td');
            ID.textContent = row.ID;
            content_div.appendChild(ID);
            
            var Name = document.createElement('td');
            Name.textContent = row.Name;
            content_div.appendChild(Name);
            
            var Status = document.createElement('td');
            var bt_td = document.createElement('td');
            var button = document.createElement('button');

            if(row.Status==1){
                Status.textContent = "顯示";
                button.textContent = "關閉";
                button.classList.add("table_button");
            }
            else{
                Status.textContent = "隱藏";
                button.textContent = "開啟";
                button.classList.add("table_button_close");
            }
            content_div.appendChild(Status);

            button.id = row.ID;

            button.addEventListener('click',function(){
                console.log(row.ID);
                web_edit(row.ID);
            })
            bt_td.appendChild(button);
            content_div.appendChild(bt_td);

            tablediv.appendChild(content_div);
        });
    })
    .catch(err => {
        alert("出現未知錯誤!");
        console.log(err);
    });
}

function web_edit(ID){
    var value = '';

    let pool = sql_connect();

    pool.getConnection()
    .then(conn => {
        return conn.query(`SELECT * FROM PageStatus WHERE ID = ${ID};`)
        .then(row => {
            row.forEach(rows => {
                value = rows['Status'];
                if(value == 1){
                    value = 0;
                }
                else{
                    value = 1;
                }
            })
        })
    })
    pool.getConnection()
    .then(conn => {
        return conn.query(
            `UPDATE PageStatus SET Status = ? WHERE ID = ?;`,
            [ value, ID]
        )
    }).then(() => {
        loadPage('website');
    })
}

function gallery_init(){
    var tablediv = document.querySelector('#web-content');

    let pool = sql_connect();

    pool.getConnection()
    .then(conn => {
        return conn.query('SELECT * FROM GalleryData ORDER BY UpdateDate ASC;')
        .then(rows => {

            var addbt = document.getElementById('addbt');
            addbt.addEventListener('click',function(){
                gallery_Edit('new');
            })

            rows.forEach(row => {
                var content_div = document.createElement('tr');

                var serialNum = document.createElement('td');
                serialNum.textContent = row.ID;
                content_div.appendChild(serialNum);
                
                var Name = document.createElement('td');
                Name.textContent = row.Name;
                content_div.appendChild(Name);
                
                var Type = document.createElement('td');
                Type.textContent = row.Type;
                content_div.appendChild(Type);
                
                var Status = document.createElement('td');
                if(row.Status==1){
                    Status.textContent = "顯示";
                }
                else{
                    Status.textContent = "隱藏";
                }
                content_div.appendChild(Status);

                var bt_td = document.createElement('td');
                var button = document.createElement('button');

                button.textContent = "編輯/更改";
                button.classList.add("table_button");
                button.id = row.serialNum;

                button.addEventListener('click',function(){
                    console.log(row.Name);
                    gallery_Edit(row.Name);
                })
                bt_td.appendChild(button);
                content_div.appendChild(bt_td);

                tablediv.appendChild(content_div);
            });

            conn.release();
            pool.end();
        })
        
    })
    .catch(err => {
        conn.release();
        pool.end();
        alert("出現未知錯誤!");
        console.log(err);
    });
}

function codemanage_init(){
    var tablediv = document.querySelector('#web-content');

    let pool = sql_connect();

    pool.getConnection()
    .then(conn => {
        return conn.query('SELECT * FROM codeData')
        .then(rows => {

            var addbt = document.getElementById('addbt');
            addbt.addEventListener('click',function(){
                code_Edit('new');
            })

            rows.forEach(row => {
                var content_div = document.createElement('tr');

                var serialNum = document.createElement('td');
                serialNum.textContent = row.serialNum;
                content_div.appendChild(serialNum);
                
                var Name = document.createElement('td');
                Name.textContent = row.Name;
                content_div.appendChild(Name);
                
                var CodeLang = document.createElement('td');
                CodeLang.textContent = row.CodeLang;
                content_div.appendChild(CodeLang);
                
                var Type = document.createElement('td');
                Type.textContent = row.Type;
                content_div.appendChild(Type);
                
                var Status = document.createElement('td');
                if(row.Status==1){
                    Status.textContent = "顯示";
                }
                else{
                    Status.textContent = "隱藏";
                }
                content_div.appendChild(Status);

                var bt_td = document.createElement('td');
                var button = document.createElement('button');

                button.textContent = "編輯/更改";
                button.classList.add("table_button");
                button.id = row.serialNum;

                button.addEventListener('click',function(){
                    console.log(row.serialNum);
                    code_Edit(row.serialNum);
                })
                bt_td.appendChild(button);
                content_div.appendChild(bt_td);

                tablediv.appendChild(content_div);
            });

            conn.release();
            pool.end();
        })
        
    })
    .catch(err => {
        conn.release();
        pool.end();
        alert("出現未知錯誤!");
        console.log(err);
    });
}

function newsupdate_init(){
    var tablediv = document.querySelector('#web-content');

    let pool = sql_connect();

    pool.getConnection()
    .then(conn => {
        return conn.query('SELECT * FROM newsData')
        .then(rows => {

            var addbt = document.getElementById('addbt');
            addbt.addEventListener('click',function(){
                console.log("success");
                news_Edit('new');
            })

            rows.forEach(row => {
                var content_div = document.createElement('tr');

                var ID = document.createElement('td');
                ID.textContent = row.ID;
                content_div.appendChild(ID);
                lastnum_news = row.ID;
                
                var Date = document.createElement('td');
                Date.textContent = row.Date;
                content_div.appendChild(Date);
                
                var Content = document.createElement('td');
                let list_text = row.Content;
                let $ = cheerio.load(list_text);
                //顯示成li
                $('li').each(function(i,elem){
                    var li_ele = document.createElement('li');
                    li_ele.textContent = $(this).text();
                    li_ele.style.fontSize = '15px';
                    Content.appendChild(li_ele);
                })
                content_div.appendChild(Content);
                //狀態bar
                var Status = document.createElement('td');
                if(row.Status==1){
                    Status.textContent = "顯示";
                }
                else{
                    Status.textContent = "隱藏";
                }
                content_div.appendChild(Status);

                var bt_td = document.createElement('td');
                var button = document.createElement('button');

                button.textContent = "編輯/更改";
                button.classList.add("table_button");
                button.id = row.ID;

                button.addEventListener('click',function(){
                    console.log(row.ID);
                    news_Edit(row.ID);
                })
                bt_td.appendChild(button);
                content_div.appendChild(bt_td);

                tablediv.appendChild(content_div);
            });
            conn.release();
            pool.end();
        })
    })  
    .catch(err => {
        conn.release();
        pool.end();
        alert("出現未知錯誤!");
        console.log(err);
    });
}

function code_Edit(serialNum){

    fetch(`Pages/codemanage/edit.html`)
            .then(response => response.text())
            .then(data => {
                document.getElementById('main-page').innerHTML = data;
                document.getElementById('main-page').scrollTop = 0;

                return new Promise(reslove => {
                    setTimeout(reslove,0);
                })
                .then(() => {

                    //載入編輯畫面
                    var title_text = document.getElementById('title-text');

                    
                    let pool = sql_connect();

                    if(serialNum == "new"){
                        title_text.textContent = "新增內容";
                    }
                    else{
                        title_text.textContent = `編輯內容 (${serialNum})`;

                        var input_num = document.getElementById('input-num');
                        var input_name = document.getElementById('input-name');
                        var input_code = document.getElementById('input-code');
                        var input_link = document.getElementById('input-link');
                        var input_lang = document.getElementById('input-lang');
                        var input_type = document.getElementById('input-type');
                        var input_status = document.getElementById('input-status');

                        pool.getConnection()
                        .then(conn => {
                            return conn.query(`SELECT * FROM codeData WHERE serialNum = '${serialNum}'`)
                            .then(row => {
                                var r_value = row[0];
                                input_num.value = r_value.serialNum;
                                input_name.value = r_value.Name;
                                input_code.value = r_value.Code;
                                input_link.value = r_value.Link;
                                input_lang.value = r_value.CodeLang;
                                input_type.value = r_value.Type;

                                input_num.ariaReadOnly = true;
                                if(r_value.Status==1){
                                    input_status.value = 'true';
                                }
                                else{
                                    input_status.value = 'false';
                                }

                                conn.release();
                            })
                        })
                        .catch(err => {
                            alert("出現一些未知錯誤，請稍後重試!")
                            console.log(err);
                            loadPage('codemanage');
                        })
                    }

                    //提交內容
                    document.getElementById('submit-form').addEventListener('submit',function(event){

                        event.preventDefault(); 

                        pool.getConnection()
                        .then(conn => {
                            let num = document.getElementById('input-num').value;
                            let name = document.getElementById('input-name').value;
                            let code = document.getElementById('input-code').value;
                            let link = document.getElementById('input-link').value;
                            let lang = document.getElementById('input-lang').value;
                            let type = document.getElementById('input-type').value;
                            var status = document.getElementById('input-status').value;
                            if(status == "true"){
                                status = 1;
                            }
                            else{
                                status = 0;
                            }

                            if(serialNum == "new"){
                                return conn.query(
                                    `INSERT INTO codeData(serialNum, Name, Code, Link, CodeLang, Type, Status) VALUES (?, ?, ?, ?, ?, ?, ?);`,
                                    [num, name, code, link, lang, type, status]
                                )
                                .then(() => {
                                    conn.release();
                                })
                            }
                            else{
                                return conn.query(
                                    `UPDATE codeData SET serialNum = ?, Name = ?, Code = ?, Link = ?, CodeLang = ?, Type = ?, Status = ? WHERE serialNum = ?;`,
                                    [num, name, code, link, lang, type, status, serialNum]
                                )
                                .then(() => {
                                    conn.release();
                                })
                            }
                        })
                        .then(() => {
                            pool.end();
                            loadPage('codemanage');
                        })
                        .catch(err => {
                            if(err.errno === 1062){
                                alert("錯誤:編號重複!");
                            }
                            else{
                                alert("出現未知錯誤!");
                                conn.release();
                                pool.end();
                                console.log(err);
                            }
                        })
                    })

                    //刪除內容
                    document.getElementById('delete_bt').addEventListener('click',function(){
                        if(confirm("確定要刪除? 這動作無法回復。")){
                            pool.getConnection()
                            .then(conn => {
                                return conn.query("DELETE FROM `codeData` WHERE SerialNum = "+ serialNum);
                            })
                            .then(() => {
                                loadPage('codemanage');
                            })
                            .catch(err => {
                                alert("出現錯誤，無法刪除!");
                                console.log(err);
                            })
                        }
                    })
                })
            })
            .catch(err => {
                alert("出現未知錯誤!");
                console.log(err);
            })
}

function news_Edit(serialNum){

    fetch(`Pages/newsupdate/edit.html`)
            .then(response => response.text())
            .then(data => {
                document.getElementById('main-page').innerHTML = data;
                document.getElementById('main-page').scrollTop = 0;

                return new Promise(reslove => {
                    setTimeout(reslove,0);
                })
                .then(() => {

                    //載入編輯畫面
                    var title_text = document.getElementById('title-text');

                    let pool = sql_connect();

                    if(serialNum == "new"){
                        title_text.textContent = "新增內容";
                        document.getElementById('input-num').value = ('0000' + (parseInt(lastnum_news) + 1)).slice(-4);
                        document.getElementById('input-date').value = new Date().toISOString().split('T')[0];
                    }
                    else{
                        title_text.textContent = `編輯內容 (${serialNum})`;

                        var input_num = document.getElementById('input-num');
                        var input_date = document.getElementById('input-date');
                        var input_content = document.getElementById('input-content');
                        var input_img = document.getElementById('input-img');
                        var input_status = document.getElementById('input-status');

                        pool.getConnection()
                        .then(conn => {
                            return conn.query(`SELECT * FROM newsData WHERE ID = '${serialNum}'`);
                        })
                        .then(row => {
                            var r_value = row[0];
                            input_num.value = r_value.ID;
                            input_date.value = r_value.Date;
                            let content_text = String(r_value.Content);
                            const formattedText = content_text
                            .replace(/<li>/g, '')
                            .replace(/<\/li>/g, '\n')
                            .replace(/\n\s*\n/g, '\n')
                            .trim();
                            input_content.value = formattedText;
                            input_img.value = r_value.Image;

                            input_num.ariaReadOnly = true;
                            if(r_value.Status==1){
                                input_status.value = 'true';
                            }
                            else{
                                input_status.value = 'false';
                            }
                        })
                        .catch(err => {
                            alert("出現一些未知錯誤，請稍後重試!");
                            console.log(err);
                            loadPage('newsupdate');
                        })
                    }

                    //提交內容
                    document.getElementById('submit-form').addEventListener('submit',function(event){

                        event.preventDefault(); 

                        pool.getConnection()
                        .then(conn => {
                            let num = document.getElementById('input-num').value;
                            let date = document.getElementById('input-date').value;
                            let content = document.getElementById('input-content').value;
                            let img = document.getElementById('input-img').value;
                            let status = document.getElementById('input-status').value;

                            if(status == "true"){
                                status = 1;
                            }
                            else{
                                status = 0;
                            }

                            const content_text = content.split('\n');
                            let send_text = '';
                            content_text.forEach((item) => {
                                send_text += "<li>"+item+"</li>";
                            })

                            if(serialNum == "new"){
                                return conn.query(
                                    `INSERT INTO newsData(ID, Date, Content, Image, Status) VALUES (?, ?, ?, ?, ?);`,
                                    [num, date, send_text, img, status]
                                ).then(() => {
                                    conn.release();
                                    pool.end();
                                })
                            }
                            else{
                                return conn.query(
                                    `UPDATE newsData SET ID = ?, Date = ?, Content = ?, Image = ?, Status = ? WHERE ID = ?;`,
                                    [num, date, send_text, img, status,serialNum]
                                ).then(() => {
                                    conn.release();
                                    pool.end();
                                })
                            }
                        })
                        .then(() => {
                            loadPage('newsupdate');
                        })
                        .catch(err => {
                            if(err.errno === 1062){
                                alert("錯誤:編號重複!");
                            }
                            else{
                                conn.release();
                                pool.end();
                                alert("出現未知錯誤!");
                                console.log(err);
                            }
                        })
                    })

                    //刪除內容
                    document.getElementById('delete_bt').addEventListener('click',function(){
                        if(confirm("確定要刪除? 這動作無法回復。")){
                            pool.getConnection()
                            .then(conn => {
                                return conn.query("DELETE FROM `newsData` WHERE ID = "+ serialNum);
                            })
                            .then(() => {
                                loadPage('newsupdate');
                            })
                            .catch(err => {
                                alert("出現錯誤，無法刪除!");
                                console.log(err);
                            })
                        }
                    })
                })
            })
            .catch(err => {
                alert("出現未知錯誤!");
                console.log(err);
            })
}

function gallery_Edit(serialNum){
    fetch(`Pages/gallery/edit.html`)
            .then(response => response.text())
            .then(data => {
                document.getElementById('main-page').innerHTML = data;
                document.getElementById('main-page').scrollTop = 0;

                return new Promise(reslove => {
                    setTimeout(reslove,0);
                })
                .then(() => {

                    //載入編輯畫面
                    var title_text = document.getElementById('title-text');

                    
                    let pool = sql_connect();
                    var input_num = document.getElementById('input-num');
                    var input_name = document.getElementById('input-name');
                    var input_nameEN = document.getElementById('input-nameEN');
                    var input_description = document.getElementById('input-description');
                    var input_descriptionEN = document.getElementById('input-descriptionEN');
                    var input_folder = document.getElementById('input-folder');
                    var input_link = document.getElementById('input-link');
                    var input_feature = document.getElementById('input-feature');
                    var input_featureEN = document.getElementById('input-featureEN');
                    var input_lang = document.getElementById('input-lang');
                    var input_type = document.getElementById('input-type');
                    var input_status = document.getElementById('input-status');

                    if(serialNum == "new"){
                        const uuid = uuidv4();
                        title_text.textContent = "新增內容";
                        input_num.value = uuid;
                    }
                    else{
                        title_text.textContent = `編輯內容 (${serialNum})`;

                        pool.getConnection()
                        .then(conn => {
                            return conn.query(`SELECT * FROM GalleryData WHERE Name = '${serialNum}';`)
                            .then(row => {


                                var r_value = row[0];
                                const data = r_value.Feature;
                                let feature = '';
                                let featureEn = '';

                                input_num.value = r_value.ID;
                                input_name.value = r_value.Name;
                                input_nameEN.value = r_value.Name_EN;
                                input_description.value = r_value.Description;
                                input_descriptionEN.value = r_value.Description_EN;
                                input_folder.value = r_value.ImageFolder;
                                
                                data.feature.forEach((item,index) => {
                                    if(index!=0) feature += '\n' + item;
                                    else feature += item;
                                })
                                data.feature_EN.forEach((item,index) => {
                                    if(index!=0) featureEn += '\n' + item;
                                    else featureEn += item;
                                })

                                input_feature.value = feature;
                                input_featureEN.value = featureEn;

                                input_lang.value = r_value.Lang;
                                input_link.value = r_value.URL;
                                input_type.value = r_value.Type;
                                
                                input_num.ariaReadOnly = true;
                                if(r_value.Status==1){
                                    input_status.value = 'true';
                                }
                                else{
                                    input_status.value = 'false';
                                }

                                conn.release();
                            })
                        })
                        .catch(err => {
                            alert("出現一些未知錯誤，請稍後重試!")
                            console.log(err);
                            loadPage('gallery');
                        })
                    }

                    //提交內容
                    document.getElementById('submit-form').addEventListener('submit',function(event){

                        event.preventDefault(); 

                        pool.getConnection()
                        .then(conn => {
                            let num = document.getElementById('input-num').value;
                            let name = document.getElementById('input-name').value;
                            let nameEN = document.getElementById('input-nameEN').value;
                            let description = document.getElementById('input-description').value;
                            let descriptionEN = document.getElementById('input-descriptionEN').value;
                            let folder = document.getElementById('input-folder').value;
                            let link = document.getElementById('input-link').value;
                            let Lang = document.getElementById('input-lang').value;
                            let feature = document.getElementById('input-feature').value;
                            let feature_EN = document.getElementById('input-featureEN').value;
                            let type = document.getElementById('input-type').value;
                            var status = document.getElementById('input-status').value;
                            var DateText = new Date().toISOString().split('T');
                            var currentDate = DateText[0] + " " + DateText[1].split('.')[0];

                            const jsonText = {
                                feature: feature.split('\n'),
                                feature_EN: feature_EN.split('\n')
                            };
                            const jsonData = JSON.stringify(jsonText,null);

                            if(status == "true"){
                                status = 1;
                            }
                            else{
                                status = 0;
                            }

                            if(serialNum == "new"){
                                return conn.query(
                                    `INSERT INTO GalleryData(ID, Name, Name_EN, Description, Description_EN, Lang, ImageFolder, Feature, Type, URL, UpdateDate, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                                    [num, name, nameEN, description, descriptionEN, Lang, folder, jsonData, type, link, currentDate, status]
                                )
                            }
                            else{
                                return conn.query(
                                    `UPDATE GalleryData SET ID = ?, Name = ?, Name_EN = ?, Description = ?, Description_EN = ?, Lang = ?, ImageFolder = ?, Feature = ?, Type = ?, URL = ?, Status = ? WHERE Name = ?;`,
                                    [num, name, nameEN, description, descriptionEN, Lang, folder, jsonData, type, link , status, serialNum]
                                )
                            }
                        })
                        .then(() => {
                            pool.end();
                            loadPage('gallery');
                        })
                        .catch(err => {
                            if(err.errno === 1062){
                                alert("錯誤:編號重複!");
                            }
                            else{
                                alert("出現未知錯誤!");
                                console.log(err);
                            }
                        })
                    })

                    //刪除內容
                    document.getElementById('delete_bt').addEventListener('click',function(){
                        if(confirm("確定要刪除? 這動作無法回復。")){
                            pool.getConnection()
                            .then(conn => {
                                return conn.query("DELETE FROM `GalleryData` WHERE Name = '" + serialNum+"';");
                            })
                            .then(() => {
                                loadPage('gallery');
                            })
                            .catch(err => {
                                alert("出現錯誤，無法刪除!");
                                console.log(err);
                            })
                        }
                    })
                })
            })
            .catch(err => {
                alert("出現未知錯誤!");
                console.log(err);
            })
}