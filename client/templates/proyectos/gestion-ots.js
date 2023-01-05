Template.gestionots.rendered = function() {

}

Template.gestionots.helpers({
    tarjetas() {
        return [{}];
    }
});

Template.gestionots.events({
    "click .tarjeta"(e) {
        var bioid = e.currentTarget.id;
        Router.go("/ots/" + bioid);
    }
})
