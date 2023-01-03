Meteor.users.allow({
  insert: function () {
    return false;
  },
  update: function () {
    return false;
  },
  remove: function () {
    return false;
  }
});

Asistencias = new Meteor.Collection('asistencias');
Asistencias.allow({
  insert: function() {
    return false;
  },
  update: function() {
    return true;
  },
  remove: function() {
    return false;
  }
});

BIAsistencias = new Meteor.Collection('biasistencias');
BIAsistencias.allow({
  insert: function() {
    return false;
  },
  update: function() {
    return false;
  },
  remove: function() {
    return false;
  }
});


FechasEspeciales = new Meteor.Collection('fechasespeciales');
FechasEspeciales.allow({
  insert: function () {
    return true;
  },
  update: function () {
    return true;
  },
  remove: function () {
    return true;
  }
});

Empresas = new Meteor.Collection('empresas');
Empresas.allow({
  insert: function() {
    return false;
  },
  update: function() {
    return false;
  },
  remove: function() {
    return false;
  }
});

Categorias = new Meteor.Collection('categorias');
Categorias.allow({
  insert: function() {
    return false;
  },
  update: function() {
    return false;
  },
  remove: function() {
    return false;
  }
});

Proyectos = new Meteor.Collection('proyectos');
Proyectos.allow({
  insert: function() {
    return false;
  },
  update: function() {
    return false;
  },
  remove: function() {
    return false;
  }
});

Cotizaciones = new Meteor.Collection('cotizaciones');
Cotizaciones.allow({
  insert: function() {
    return false;
  },
  update: function() {
    return false;
  },
  remove: function() {
    return false;
  }
});

Gastos = new Meteor.Collection('gastos');
Gastos.allow({
  insert: function() {
    return false;
  },
  update: function() {
    return false;
  },
  remove: function() {
    return false;
  }
});

Items = new Meteor.Collection('items');
Items.allow({
  insert: function() {
    return false;
  },
  update: function() {
    return false;
  },
  remove: function() {
    return false;
  }
});

BIOts = new Meteor.Collection("biots");
BIOts.allow({
  insert: function() { return false; },
  update: function() { return false; },
  remove: function() { return false; }
});

Ots = new Meteor.Collection("Ots");
Ots.allow({
  insert: function() { return false; },
  update: function() { return false; },
  remove: function() { return false; }
});