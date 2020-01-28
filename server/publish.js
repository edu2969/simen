Meteor.publish('cuentas', function () {
  if (!this.userId) return [];
  return Meteor.users.find();
});

Meteor.publish('empresas', function () {
  return Empresas.find();
});

Meteor.publish('colaboradores', function() {
  return Meteor.users.find({
    "profile.role": 6
  });
})

Meteor.publishComposite('proyectosUsuario', function () {
  return {
    find: function () {
      return Equipos.find({
        usuarioId: this.userId
      });
    },
    children: [{
      find: function (e) {
        return Proyectos.find({
          usuarioId: e.usuarioId
        });
      },
      children: [{
        find: function (p) {
          return Cotizaciones.find({
            proyectoId: p._id
          });
        },
        children: [{
          find: function (c) {
            return Items.find({
              cotizacionId: c._id
            });
          }
        }]
      }]
    }]
  }
});

Meteor.publishComposite('cotizacionesEmpresa', function () {
  if (!Meteor.user()) return;
  var identificador = Meteor.user().sesion && Meteor.user().sesion["identificador"];
  if (!identificador) return;
  var empresa = Empresas.findOne({
    identificador: identificador
  });

  return {
    find: function () {
      return Cotizaciones.find({
        creadorId: {
          $in: Equipos.find({
            empresaId: empresa._id
          }).map(function (o) {
            return o.usuarioId;
          })
        }
      });
    },
    children: [{
      find: function (c) {
        return Items.find({
          cotizacionId: c._id
        });
      }
    }]
  }
});

Meteor.publish("estadosCotizaciones", function () {
  return Categorias.find({
    llave: "EST_COT"
  });
});

Meteor.publishComposite('facturasEmpresa', function () {
  var gerenteId = Equipos.findOne({
    empresaId: Equipos.findOne({
      usuarioId: this.userId
    }).empresaId,
    rol: "Gerente"
  }).usuarioId;
  var socioreg = Equipos.findOne({
    empresaId: Equipos.findOne({
      usuarioId: this.userId
    }).empresaId,
    rol: "Socio"
  });
  var socioId = socioreg ? socioreg.usuarioId : false;
  var ids = [];
  if (gerenteId) ids.push(gerenteId);
  if (socioId) ids.push(socioId);
  return {
    find: function () {
      return Cotizaciones.find({
        creadorId: {
          $in: ids
        },
        estado: 3
      });
    },
    children: [{
      find: function (c) {
        return Items.find({
          cotizacionId: c._id
        });
      }
    }]
  }
});

Meteor.publish("estadosFacturas", function () {
  return Categorias.find({
    llave: "EST_FAC"
  });
});

Meteor.publishComposite('proyectoUsuario', function (proyectoId) {
  return {
    find: function () {
      return Proyectos.find({
        _id: proyectoId
      });
    },
    children: [{
      find: function (p) {
        return Cotizaciones.find({
          proyectoId: p._id
        });
      }
    }]
  }
});

Meteor.publishComposite("proyecto", function (pId) {
  return {
    find: function () {
      return Proyectos.find({
        _id: pId
      });
    },
    children: [{
      find: function (p) {
        return Cotizaciones.find({
          proyectoId: p._id
        }, {
          sort: {
            fecha: 1
          }
        });
      },
      children: [{
        find: function (c) {
          return Items.find({
            cotizacionId: c._id
          });
        }
      }]
    }, {
      find: function (p) {
        return Gastos.find({
          proyectoId: p._id
        }, {
          sort: {
            fecha: 1
          }
        });
      },
      children: [{
        find: function (g) {
          return Items.find({
            gastoId: g._id
          });
        }
      }]
    }]
  };
});

Meteor.publishComposite('cotizacionesProyecto', function (proyectoId) {
  return {
    find: function () {
      return Cotizaciones.find({
        proyectoId: proyectoId
      });
    },
    children: [{
      find: function (c) {
        return Items.find({
          cotizacionId: c._id
        });
      }
    }]
  }
});

Meteor.publishComposite('empresa', function (empresaId) {
  return {
    find: function () {
      return Empresas.find({
        _id: empresaId
      });
    },
    children: [{
      find: function (e) {
        return Equipos.find({
          empresaId: e._id
        });
      }
    }]
  }
});

Meteor.publishComposite("asistencias", function (bioId, month, year) {
  return {
    find() {
      return Meteor.users.find({ "profile.bioId": Number(bioId) });
    },
    children: [{
      find(u) {
        return Asistencias.find({
          userId: u._id,
          month: Number(month) - 1,
          year: Number(year)
        });
      }
    }]
  }
});

Meteor.publish("biasistencias", function () {
  var hoy = moment().endOf("month");
  var seismesesatras = moment().startOf("month").add(-12, "months");
  return BIAsistencias.find({
    $or: [{
      month: {
        $gte: seismesesatras.get("month")
      },
      year: seismesesatras.get("year")
        }, {
      month: {
        $lte: hoy.get("month")
      },
      year: hoy.get("year")
        }]
  });
});

Meteor.publish("fechasEspeciales", function () {
  return FechasEspeciales.find();
});

Meteor.publish("gestionots", function () {
  return BIOts.find();
});

Meteor.publish("ots", function (bioid) {
  return Ots.find({
    bioId: bioid
  });
});