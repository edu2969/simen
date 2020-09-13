Template.cuentas.rendered = function () {
  Session.set('NavigationPath', false);
  if (Meteor.user().profile.role == 1) {
    Session.set('RolSeleccionado', 1);
  } else {
    Session.set('RolSeleccionado', 6);
  }
}

Template.cuentas.helpers({
  isAdmin: function () {
    return Meteor.user() && Meteor.user().profile.role == 1;
  },
  adminSel: function () {
    return Session.get('RolSeleccionado') == 1;
  },
  rol2Sel: function () {
    return Session.get('RolSeleccionado') == 2;
  },
  rol3Sel: function () {
    return Session.get('RolSeleccionado') == 3;
  },
  rol4Sel: function () {
    return Session.get('RolSeleccionado') == 4;
  },
  rol5Sel: function () {
    return Session.get('RolSeleccionado') == 5;
  },
  rolTrabajadores: function () {
    return Session.get('RolSeleccionado') == 6;
  },
  rolDesvinculados: function () {
    return Session.get('RolSeleccionado') == 7;
  },
  accountsCount: function () {
    return Meteor.users.find({
      "profile.role": Session.get('RolSeleccionado')
    });
  },
  cantidadTrabajadores() {
    return Meteor.users.find({ "profile.role": 6 }).count()
  },
  accounts: function () {
    return Meteor.users.find({
      "profile.role": Session.get("RolSeleccionado")
    }, { sort: { "profile.prioridad": 1 }}).map(function (a, index) {
      a.index = index + 1;
      a.oculto = a.profile.bioId == -1;
      a.desvinculado = a.profile.role == 7;
      return a;
    });
  },
  rolSeleccionado: function () {
    switch (Session.get('RolSeleccionado')) {
      case 1:
        return '_EdU_';
      case 2:
        return 'Gerente';
      case 3:
        return 'Asesores';
      case 4:
        return 'Socios';
      case 5:
        return 'Vendedores';
      case 6:
        return 'Trabajadores';
      case 7:
        return 'Desvinculados';
      default:
        return 'Rol desconocido' + Session.get('RolSeleccionado');
    }
  }
});

Template.cuentas.events({
  'click #tab-admin': function (e) {
    e.preventDefault();
    Session.set('RolSeleccionado', 1);
  },
  'click .tab-rol': function (e) {
    e.preventDefault();
    var id = e.currentTarget.id.substring(7);
    Session.set('RolSeleccionado', Number(id));
  },
  'click .btn-edit': function (e) {
    var btn = e.currentTarget;
    var userId = btn.id;
    var user = Meteor.users.findOne({
      _id: userId
    });
    if (user) {
      Session.set('UsrSel', user);
      AddNav('/cuentas');
      Router.go('/cuentaEdit');
    }
  },
  'click .btn-eliminar': function (e) {
    var btnid = e.currentTarget.id;
    var usuario = Meteor.users.findOne(btnid);
    Session.set('Parametros', {
      entidad: "usuario",
      id: btnid,
      identificacion: usuario.profile.name,
      operacion: "eliminar"
    });
    $('#modal-confirmacion-eliminacion').modal('show');
  },
  'click .btn-desvincular': function (e) {
    var btnid = e.currentTarget.id;
    var usuario = Meteor.users.findOne(btnid);
    Session.set('Parametros', {
      entidad: "usuario",
      id: btnid,
      identificacion: usuario.profile.name,
      operacion: "desvincular"
    });
    $('#modal-confirmacion-eliminacion').modal('show');
  },
  'click #btn-add-account': function (e) {
    e.preventDefault();
    Session.set("UsrSel", {
      profile: {
        role: Session.get("RolSeleccionado")
      },
      emails: [{
        address: "",
        verified: false
            }]
    });
    AddNav('/cuentas');
    Router.go('/cuentaEdit');
  }
});