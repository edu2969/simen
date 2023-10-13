Template.modalConfirmacionEliminacion.helpers({
  parametros: function () {
    var params = Session.get('Parametros');
    if(!params) return false;
    return params;
  }
});

Template.modalConfirmacionEliminacion.events({
  'click #btn-confirm': function (e) {
    e.preventDefault();
    var params = Session.get('Parametros');
    if (!params) return;
    $('#modal-confirmacion-eliminacion').modal('hide');
    var ruta = false;
    switch(params.entidad) {
      case "item": Items.remove(params.id); break;
      case "proyecto": Proyectos.remove(params.id); break;
      case "fechaespecial": FechasEspeciales.remove(params.id); break;
      case "jornada": 
      case "cotizacion": Items.find({ cotizacionId: params.id }).forEach(function(o) { Items.remove(o._id); }); Cotizaciones.remove(params.id); break;
      case "usuario": 
        Meteor.call("EliminarUsuario", params.id); 
        break;
    }    
    delete Session.keys["Parametros"];    
  }
});