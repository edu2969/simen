Template.navigation.events({
  'click .js-logout': function () {
    console.log("POR ACA");
    Meteor.logout();
  }
})