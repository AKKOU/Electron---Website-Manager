const {ipcRenderer} = require('electron');
var isOpen = false;

window.onload = function() {
    console.log("load renderer")
    const min_bt = document.getElementById('control-min');
    const max_bt = document.getElementById('control-max');
    const close_bt = document.getElementById('control-close');
    const menu_bt = document.getElementById('menu-bt');
    const home_bt = document.getElementById('home-bt');

    loadPage('ssh');

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
        const todolist_bt = document.getElementById('todolist-bt');
        const test3_home = document.getElementById('test3-bt');
        if(isOpen){
            menu_bt.style.letterSpacing = "1000px";
            home_bt.style.letterSpacing = "1000px";
            admin_bt.style.letterSpacing = "1000px";
            todolist_bt.style.letterSpacing = "1000px";
            test3_home.style.letterSpacing = "1000px";

            menu.style.transition = ".2s ease-in-out";
            menu.style.gridTemplateColumns = "70px 100%";
            isOpen = false;
        }
        else{
            menu_bt.style.letterSpacing = "2px";
            home_bt.style.letterSpacing = "2px";
            admin_bt.style.letterSpacing = "2px";
            todolist_bt.style.letterSpacing = "2px";
            test3_home.style.letterSpacing = "2px";
            
            menu.style.transition = ".2s ease-in-out";
            menu.style.gridTemplateColumns = "150px 100%";
            isOpen = true;
        }
    })

    home_bt.addEventListener('click',function(){

    });

}

function loadPage(names){
    fetch(`Pages/${names}/${names}.html`)
        .then(response => response.text())
        .then(data => {
            document.getElementById('main-page').innerHTML = data;
            const script = document.createElement('script');
            script.src = `Pages/${names}/${names}_renderer.js`;
            document.body.appendChild(script);
        })
}
