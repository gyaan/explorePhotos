var app = angular.module('explorePhotos', ['ngRoute', 'infinite-scroll']).run(function($http, $rootScope, $location) {

  $rootScope.authenticated = false;
  $rootScope.current_user = 'Guest';

  $rootScope.user = {};
  $rootScope.photoOrder = 'upvotescount'

  //first check if user is already loggedin or not 
  $http.get('/api/islogin').success(function(data) {

    if (data.state == 'success') {
      $rootScope.authenticated = true;
      $rootScope.current_user = data.user.Username;
      $rootScope.user = data.user;
      $location.path('/');
    } else {
      $rootScope.error_message = data.message;
    }

  });

  $rootScope.signout = function() {
    $http.get('auth/signout');
    $rootScope.authenticated = false;
    $rootScope.current_user = 'Guest';
  };
});

app.config(function($routeProvider) {
  $routeProvider
  //the timeline display
    .when('/', {
      templateUrl: 'main.html',
      controller: 'mainController'
    })
    //the login display
    .when('/login', {
      templateUrl: 'login.html',
      controller: 'authController'
    })
    //the signup display
    .when('/signup', {
      templateUrl: 'register.html',
      controller: 'authController'
    });
});

//similarly we have to do for upvote and downvote

app.factory('photosService', function($http, $rootScope) {
  var photosService = function() {
    this.photos = [];
    this.busy = false;
    this.after = 1;
  };

  photosService.prototype.nextPage = function() {
    if (this.busy) return;

    if (this.after < 1) //stop when there is no page
      return
    this.busy = true;

    var url = "http://localhost:3000/api/photos?current_page=" + this.after + "&requestorderby=" + $rootScope.photoOrder;
    $http.get(url).success(function(data) {
      var items = data.Photos;
      // console.log(data.Photos);

      for (var i = 0; i < items.length; i++) {
        this.photos.push(items[i]);
      }
      // console.log(data.NextPage);
      this.after = data.NextPage;
      this.busy = false;

    }.bind(this));
  };

  return photosService;

});


app.controller('mainController', function($scope, $http, $rootScope, $location, photosService, $route, $compile) {
  $scope.photosService = new photosService();

  $scope.changeOrder = function(orderby) {
    $rootScope.photoOrder = orderby;
    $route.reload();
  }

  $scope.votesMe = function($event, vote) {

    var item = $event.target;

    var voteDetails = {
      'user_id': $rootScope.user.Id,
      'photo_id': item.attributes['data-photoid'].value,
      'vote': vote
    };

    //disable buttons
    $($event.target).hide();
    if (vote == 1) {
      //increase the count 
      var jlo = angular.element($event.target);
      var oldCount = parseInt($event.target.attributes['data-upvotes-count'].value);

      if (oldCount > 0) {
        jlo.next().next().text(oldCount + 1);
      } else {
        $compile('<span class="glyphicon glyphicon-thumbs-up" style="color: #006400;"></span> <span style = "color: #006400;"> 1 </span>')($scope).appendTo(jlo.parent());
      }

      jlo.parent().next().find('.downvote').hide();

    } else {
      var jlo = angular.element($event.target);

      var oldCount = parseInt($event.target.attributes['data-downvotes-count'].value)

      if (oldCount > 0) {
        jlo.next().next().text(oldCount + 1);
      } else {
        $compile('<span class="glyphicon glyphicon-thumbs-down" style="color: #006400;"></span> <span style = "color: #006400;"> 1 </span>')($scope).appendTo(jlo.parent());
      }
      jlo.parent().parent().find('.upvote').hide();
    }

    //add this photo to user liked photo list 
    $rootScope.user.UserVotedPhotos[item.attributes['data-photoid'].value]=1;

    $http.post('/api/votes', voteDetails).success(function(data) {

      if (data.state == 'success') {
        //add photoid to votedphoto list 
        console.log(data.Vote);


      } else {
        $scope.error_message = data.message;
      }

    });

  }

});

app.controller('authController', function($scope, $http, $rootScope, $location) {
  $scope.user = {
    username: '',
    password: ''
  };
  $scope.error_message = '';

  $scope.login = function() {
    $http.post('/auth/login', $scope.user).success(function(data) {

      if (data.state == 'success') {
        $rootScope.authenticated = true;
        $rootScope.current_user = data.user.Username;
        $rootScope.user = data.user;
        $location.path('/');
      } else {
        $scope.error_message = data.message;
      }

    });
  };

  $scope.register = function() {
    $scope.error_message = 'registeration request for ' + $scope.user.username;
    $http.post('auth/signup', $scope.user).success(function(data) {
      if (data.state == 'success') {
        $rootScope.authenticated = true;
        console.log(data);
        console.log($rootScope.authenticated);
        $rootScope.current_user = data.user.Username;
        $rootScope.user = data.user;
        $location.path('/');
      } else {
        $scope.error_message = data.message;
      }

    });

  };
});


app.directive('colorbox', function() {
  return {
    restrict: 'AC',
    link: function(scope, element, attrs) {
      $(element).colorbox(attrs.colorbox);
    }
  };
});

/* apart form angulr */
/*
//We are using $(window).load here because we want to wait until the images are loaded  
$(window).load(function() {
  //for each description div...  
  $('div.image_description').each(function() {
    //...set the opacity to 0...  
    $(this).css('opacity', 0);
    //..set width same as the image...  
    $(this).css('width', $(this).siblings('img').width());
    //...get the parent (the wrapper) and set it's width same as the image width... '  
    $(this).parent().css('width', $(this).siblings('img').width());
    //...set the display to block  
    $(this).css('display', 'block');
  });

  $('div.image_wrapper').hover(function() {
    //when mouse hover over the wrapper div  
    //get it's children elements with class description '  
    //and show it using fadeTo  
    $(this).children('.image_description').stop().fadeTo(500, 0.8);
  }, function() {
    //when mouse out of the wrapper div  
    //use fadeTo to hide the div  
    $(this).children('.image_description').stop().fadeTo(500, 0);
  });

});
*/