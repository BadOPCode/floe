var page_object = {
   title: "This is front page!"  
};
var app = angular.module("app", ["ngAnimate", "ui.bootstrap"]);

app.controller("PageCtrl", function(){
});

app.controller("AppCtrl", function(){
    this.info = page_object;
    this.header = page_object.title;
});

app.controller("SideShelfPanel", function($scope) {
    this.menuOpen = false;
    this.title = "Side Shelf";
    
    this.toggleMenuState = function() {
       this.menuOpen = !this.menuOpen;  
    };
});

app.controller("SideMenu", function(){
    
});