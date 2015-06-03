var page_object = {
    title: "This is front page!"
};
var floeApp = angular.module("floeApp", ["oc.lazyLoad", "ngAnimate", "ui.bootstrap"]);
var $injector = angular.injector();

floeApp.controller("appCtrl", function($scope, $ocLazyLoad, $injector) {
    this.info = page_object;
    this.header = page_object.title;
    $ocLazyLoad.load([ '/js/services/floe-services.js']).then(function() {
        $scope.floeServices = $injector.get("floeServices");
    })
});

floeApp.controller("sideShelfCtrl", function($scope) {
    this.menuOpen = false;
    this.title = "Side Shelf";

    this.toggleMenuState = function() {
        this.menuOpen = !this.menuOpen;
    };
});

floeApp.controller("sideMenuCtrl", function() {});

floeApp.controller("pageCtrl", function() {});
