var MENU_KEY = 'menuOpen';
Session.setDefault(MENU_KEY, false);

var USER_MENU_KEY = 'userMenuOpen';
Session.setDefault(USER_MENU_KEY, false);

var SHOW_CONNECTION_ISSUE_KEY = 'showConnectionIssue';
Session.setDefault(SHOW_CONNECTION_ISSUE_KEY, false);

var CONNECTION_ISSUE_TIMEOUT = 5000;

Meteor.startup(function () {
  Session.set("IdentificadorEmpresa", false);
  //Typeahead instances
  Meteor.typeahead.inject();
  
  // set up a swipe left / right handler
  $(document.body).touchwipe({
    wipeLeft: function () {
      Session.set(MENU_KEY, false);
    },
    wipeRight: function () {
      Session.set(MENU_KEY, true);
    },
    preventDefaultEvents: false
  });

  setTimeout(function () {
    Session.set(SHOW_CONNECTION_ISSUE_KEY, true);
  }, CONNECTION_ISSUE_TIMEOUT);
});

Template.appBody.helpers({
  menuOpen: function () {
    return Meteor.userId() && Session.get(MENU_KEY) && 'menu-open';
  },
  cordova: function () {
    return Meteor.isCordova && 'cordova';
  },
  userMenuOpen: function () {
    return Session.get(USER_MENU_KEY);
  },
  connected: function () {
    if (Session.get(SHOW_CONNECTION_ISSUE_KEY)) {
      return Meteor.status().connected;
    } else {
      return true;
    }
  },
  descripcionPagina: function() {
    return Session.get("DescripcionPagina");
  },
  empresas: function() {
    return Empresas.find();
  },
  logged() {
    return Meteor.userId() != null;
  }
});

Template.appBody.events({
  'click .js-menu': function () {
    Session.set(MENU_KEY, !Session.get(MENU_KEY));
  },
  'click .content-overlay': function (event) {
    Session.set(MENU_KEY, false);
    event.preventDefault();
  },
  'click .js-user-menu': function (event) {
    Session.set(USER_MENU_KEY, !Session.get(USER_MENU_KEY));
    // stop the menu from closing
    event.stopImmediatePropagation();
  },
  'click #menu a': function () {
    Session.set(MENU_KEY, false);
  }
});
