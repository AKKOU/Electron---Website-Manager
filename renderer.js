const {ipcRenderer} = require('electron');
const crypto = require('crypto')
const mariadb = require('mariadb');
const { promises } = require('dns');

var isOpen = false;
var isLogin = false;
var username = "";
let env;

ipcRenderer.on('env',(event,received)=>{
    env = received;
})

window.onload = function() {
    console.log("load renderer")
    const min_bt = document.getElementById('control-min');
    const max_bt = document.getElementById('control-max');
    const close_bt = document.getElementById('control-close');

    const menu_bt = document.getElementById('menu-bt');
    const home_bt = document.getElementById('home-bt');
    const login_bt = document.getElementById('login-bt');
    const web_bt = document.getElementById('web-bt');

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
        const menu = document.getElementById('main-container');
        const home_bt = document.getElementById('home-bt');
        const admin_bt = document.getElementById('admin-bt');
        const web_bt = document.getElementById('web-bt');
        if(isOpen){
            menu_bt.style.letterSpacing = "1000px";
            home_bt.style.letterSpacing = "1000px";
            admin_bt.style.letterSpacing = "1000px";
            web_bt.style.letterSpacing = "1000px";
            login_bt.style.letterSpacing = "1000px";

            menu.style.transition = ".2s ease-in-out";
            menu.style.gridTemplateColumns = "70px 100%";
            isOpen = false;
        }
        else{
            menu_bt.style.letterSpacing = "2px";
            home_bt.style.letterSpacing = "2px";
            admin_bt.style.letterSpacing = "2px";
            web_bt.style.letterSpacing = "2px";
            login_bt.style.letterSpacing = "2px";
            
            menu.style.transition = ".2s ease-in-out";
            menu.style.gridTemplateColumns = "170px 100%";
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

    web_bt.addEventListener('click',function(){
        loadPage('web');
    })

}

function loadPage(names){
    fetch(`Pages/${names}/${names}.html`)
        .then(response => response.text())
        .then(data => {
            document.getElementById('main-page').innerHTML = data;
            if(names==='login'){
                login_init();
            }
            if(names==='home'){
                home_init();
            }
            if(names==='web'){
                web_init();
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
        document.getElementById('timenow').innerText = time.getFullYear() + "." + time.getMonth() + "." + time.getDay();
    }
    else{
        document.getElementById('user-name').innerText = "請登入";
    }
}

function login_init(){
    const json = JSON.stringify(env);
    const dbdata = JSON.parse(json);
    const admin_bt = document.getElementById('admin-bt');
    const web_bt = document.getElementById('web-bt');

    document.getElementById('loginForm').addEventListener('submit',function(event){
        event.preventDefault();

        username = document.getElementById('usr').value;
        const password = document.getElementById('pwd').value;

        let hash = crypto.createHash('sha256');
        hash.update(password);
        
        let pool = mariadb.createPool({
            host: dbdata.DB_HOST,
            user: dbdata.DB_USER,
            password: dbdata.DB_PASSWORD,
            port: 3306,
            database: dbdata.DB_NAME
        });
        
        pool.getConnection()
            .then(conn => {
                return conn.query('SELECT * FROM accountData WHERE Username = ? AND Password = ?', [username, hash.digest('hex')]);
            })
            .then(rows => {
                if(rows.length > 0){
                    alert("歡迎登入");
                    isLogin = true;
                    admin_bt.hidden = false;
                    web_bt.hidden = false;
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
    const admin_bt = document.getElementById('admin-bt');
    const web_bt = document.getElementById('web-bt');

    if(confirm("確定要登出嗎?")){
        isLogin = false;
        admin_bt.hidden = true;
        web_bt.hidden = true;
        alert("登出成功!");
        loadPage('home');
    }
}

function web_init(){
    const json = JSON.stringify(env);
    const dbdata = JSON.parse(json);
    var tablediv = document.querySelector('#web-content');

    let pool = mariadb.createPool({
            host: dbdata.DB_HOST,
            user: dbdata.DB_USER,
            password: dbdata.DB_PASSWORD,
            port: 3306,
            database: dbdata.DB_NAME
        });

    pool.getConnection()
    .then(conn => {
        return conn.query('SELECT * FROM codeData')
    })
    .then(rows => {

        var addbt = document.getElementById('addbt');
        addbt.addEventListener('click',function(){
            openEditPage('new');
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

            var button = document.createElement('button');

            button.textContent = "編輯/更改";
            button.classList.add("table_button");
            button.id = row.serialNum;

            button.addEventListener('click',function(){
                console.log(row.serialNum);
                openEditPage(row.serialNum);
            })
            content_div.appendChild(button);

            tablediv.appendChild(content_div);
        });
    })
    .catch(err => {
        alert("出現未知錯誤!");
        console.log(err);
    });
}

function openEditPage(serialNum){

    fetch(`Pages/web/edit.html`)
            .then(response => response.text())
            .then(data => {
                document.getElementById('main-page').innerHTML = data;
                document.getElementById('main-page').scrollTop = 0;

                return new Promise(reslove => {
                    setTimeout(reslove,0);
                })
                .then(() => {

                    const json = JSON.stringify(env);
                    const dbdata = JSON.parse(json);

                    //載入編輯畫面
                    var title_text = document.getElementById('title-text');

                    
                    let pool = mariadb.createPool({
                        host: dbdata.DB_HOST,
                        user: dbdata.DB_USER,
                        password: dbdata.DB_PASSWORD,
                        port: 3306,
                        database: dbdata.DB_NAME
                    });

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
                            return conn.query(`SELECT * FROM codeData WHERE serialNum = '${serialNum}'`);
                        })
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
                        })
                        .catch(err => {
                            alert("出現一些未知錯誤，請稍後重試!")
                            console.log(err);
                            loadPage('web');
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
                                );
                            }
                            else{
                                return conn.query(
                                    `UPDATE codeData SET serialNum = ?, Name = ?, Code = ?, Link = ?, CodeLang = ?, Type = ?, Status = ? WHERE serialNum = ?;`,
                                    [num, name, code, link, lang, type, status, serialNum]
                                );
                            }
                        })
                        .then(() => {
                            loadPage('web');
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
                                return conn.query("DELETE FROM `codeData` WHERE SerialNum = "+ serialNum);
                            })
                            .then(() => {
                                loadPage('web');
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