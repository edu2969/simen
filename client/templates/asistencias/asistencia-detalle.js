import { TIPOS_JORNADAS } from "../../../lib/misc";

Template.asistenciaDetalle.rendered = function () {
  Session.set("ImportMessages", false);
}

Template.asistenciaDetalle.helpers({
  pdfPath: function () {
    var bioId = Number(Router.current().params.bioId);
    var params = Router.current().params.month + "/" + Router.current().params.year;
    return bioId + "/" + params + "/" + Meteor.user().profile.role;
  },
  user: function () {
    var bioId = Number(Router.current().params.bioId);
    if (bioId) return Meteor.users.findOne({
      "profile.bioId": bioId
    });
    return false;
  },
  period: function () {
    return moment().month(Router.current().params.month - 1).format('MMMM')
      + ' ' + Router.current().params.year;
  },
  stats: function () {
    return Session.get('Stats');
  },
  calendars: function () {
    var dayRegs = {};
    var month = Number(Router.current().params.month) - 1;
    var year = Number(Router.current().params.year);
    var bioId = Number(Router.current().params.bioId);
    year = year < 1000 ? year + 2000 : year;
    var stats = {
      lateDays: 0,
      absentDays: 0,
      noMarked: 0,
      hhNormal: 0,
      hh50: 0,
      hh100: 0,
      vacaciones: 0,
      total: {
        hhNormal: 0,
        hh50: 0,
        hh100: 0
      }
    };
    var lastMonthDay = new Date(year, month + 1, 0).getDate();
    var userId = Meteor.users.findOne({
      "profile.bioId": bioId
    })._id;

    for (var i = 1; i <= lastMonthDay; i++) {
      var reg = new Object();
      var period = new Date(year, month, i);
      const horasJornadaDelDia = moment(period).get("day") == 5 ? 7.5 : 9;
      reg.day = i;
      reg.dayName = DayShortNames[period.getDay()];
      reg.month = period.getMonth()
      reg.year = period.getFullYear()

      var assist = Asistencias.findOne({
        userId: userId,
        day: i,
        month: month,
        year: year
      });

      // Si no hay registro de asistencia, crea uno vacío
      if (!assist) assist = new Object();
      reg.assistId = assist._id;
      if (assist.tiponota) reg.tiponota = assist.tiponota;

      // Es feriado
      var tJorn = TipoJornada(period);
      reg.isHolyDay = tJorn == TIPOS_JORNADAS.FERIADO_LEGAL || tJorn == TIPOS_JORNADAS.COMPENSACION_VACACIONES;
      reg.isWeekend = period.getDay() == 0 || period.getDay() == 6;
      reg.isMediaJornada = tJorn == TIPOS_JORNADAS.MEDIA_JORNADA;
      if(reg.isHolyDay || reg.isWeekend || !assist.marcas?.length) {
        reg.licenciable = true;
      }

      // marcaciones y estilos
      if (!assist.vacacion && !assist.licencia && assist.marcas) {
        var marcas = assist.marcas;
        var array = [];
        var isIn = true;

        for (var index = 0; index < marcas.length; index++) {
          var item = new Object();

          if (!marcas[index].invalida) {
            item.style = 'success';

            // Feriado o Domingo, HH 100%
            if (reg.isHolyDay || period.getDay() == 0) {
              item.style = 'info';
            } else if (marcas[index].ms >= 19 * 60 * 60 * 3600 || period.getDay() == 6) {
              item.style = 'warning';
            }

            if (index > 0 &&
              marcas[index].ms - marcas[index - 1].ms < 10 * 60 * 3600) {
              item.glyphicon = 'remove';
              item.style = 'danger';
            } else {
              item.glyphicon = isIn ? 'log-in' : 'log-out';
              isIn = !isIn;
            }

            if (index > 0 &&
              marcas[marcas.length - 1].ms > 19 * 60 * 60 * 3600 &&
              marcas[index].ms > 18 * 60 * 60 * 3600 &&
              marcas[index].ms < 19 * 60 * 60 * 3600) {
              item.glyphicon = 'remove';
              item.style = 'danger';
            }

            if (index == 0 &&
              period.getDay() != 0 &&
              period.getDay() != 6 &&
              marcas[0].ms > 8 * 60 * 60 * 3600 + 40 * 60 * 3600) {
              if (!item.forzada) {
                item.isLate = true;
                stats.lateDays++;
              }
            }

            if (marcas.length < 4 &&
              !reg.isMediaJornada &&
              period.getDay() != 0 && period.getDay() != 6
            ) {
              item.style = 'default';
            }
          } else {
            item.style = 'default';
            item.glyphicon = 'glyphicon glyphicon-ban-circle';
          }
          item.time = HourFormat(marcas[index].ms);
          item.assistId = reg.assistId;
          item.day = reg.day;
          item.index = index;
          item.tieneNota = !_.isEmpty(marcas[index].nota);
          array.push(item);
        }

        reg.marcasView = array;

        if (array.length <= 1 && !reg.isMediaJornada) {
          stats.noMarked++;
        }
      }

      if (assist.hhNormal) {
        if (TipoJornada(period) == TIPOS_JORNADAS.MEDIA_JORNADA) {
          reg.hhNormal = assist.hhNormal + 4.5;
        } else {
          reg.hhNormal = assist.hhNormal;
        }
      }
      if (assist.hhExt50) reg.hhExt50 = assist.hhExt50;
      if (assist.hhExt100) reg.hhExt100 = assist.hhExt100;
      const finDeSemana = period.getDay() != 0 && period.getDay() != 6;
      if (finDeSemana &&  !reg.isHolyDay) {
        if (!reg.marcasView || reg.marcasView.length == 0) {
          if (!assist.vacacion && !assist.licencia) {            
            reg.vacacionable = true;
            stats.absentDays++;
            reg.hhNormal = 0;
          } else if(assist.vacacion) {
            stats.vacaciones++
            reg.hhNormal = 9
            reg.vacacion = true
          }
        }
      } 
      if(assist.licencia) {
        stats.licencia++;
        reg.hhNormal = 0;
        reg.licencia = true;
      }
      stats.hhNormal += reg.hhNormal || 0;
      stats.hh50 += reg.hhExt50 || 0
      stats.hh100 += reg.hhExt100 || 0

      // Agrega el registro
      dayRegs[i] = reg;
    }

    // Calculo final de horas
    stats.total.hhNormal = stats.hhNormal;
    stats.total.hh50 = stats.hh50;
    stats.total.hh100 = stats.hh100;
    // Compensación con horas al 50%
    if (stats.total.hhNormal < 0) {
      if (-1 * stats.total.hhNormal > stats.total.hh50) {
        stats.total.hhNormal = stats.total.hhNormal + stats.total.hh50
        stats.total.hh50 = 0
      } else {
        stats.total.hh50 = stats.total.hh50 + stats.total.hhNormal
        stats.total.hhNormal = 0
      }
    }
    // Si aún no son cubiertas, se cubren con HH al 100%
    if (stats.total.hhNormal < 0) {
      if (-1 * stats.total.hhNormal > stats.total.hh100) {
        stats.total.hhNormal = stats.total.hhNormal + stats.total.hh100
        stats.total.hh100 = 0
      } else {
        stats.total.hh100 = stats.total.hh100 + stats.total.hhNormal
        stats.total.hhNormal = 0
      }
    }
    Session.set('Stats', stats);

    var keys = [];
    for (var key in dayRegs) {
      if (dayRegs.hasOwnProperty(key)) {
        keys.push(dayRegs[key]);
      }
    }
    return keys;
  },
  isColaborator: function () {
    return Meteor.user().profile.role == 6;
  },
  observacionMes: function () {
    var bioId = Number(Router.current().params.bioId)
    if (!bioId) return "";
    var user = Meteor.users.findOne({
      "profile.bioId": bioId
    })
    if (user) {
      var registro = undefined;
      if (user.profile.libro) {
        registro = user.profile.libro.filter(function (item) {
          return item.periodo === (
            Router.current().params.month + "/"
            + Router.current().params.year
          )
        })[0]
      }
      if (registro) return registro.observacion
    }
    return "";
  },
  esGerente: function () {
    return Meteor.user().profile.role == 2;
  },
  esSocio: function () {
    return Meteor.user().profile.role == 4;
  },
  esOlaya: function () {
    return Meteor.user().profile.role == 3;
  },
  imprimible: function () {
    return Meteor.user().profile.role == 1 || Meteor.user().profile.role == 2;
  }
});

Template.asistenciaDetalle.events({
  'click .btn-edit-marcation': function (e) {
    e.preventDefault();

    var mixId = e.currentTarget.id.split('-');
    var params = new Object();
    params.assistId = mixId[0];
    params.day = Number(mixId[1]);
    params.index = Number(mixId[2]);
    params.esPrimera = params.index == 0
    Session.set('MarcationParams', params);
    var assist = Asistencias.findOne(params.assistId);
    params.esForzada = assist && assist.marcas[0] ? assist.marcas[0].esForzada : false

    if (assist && assist.marcas && assist.marcas[params.index]) {
      $('#change-log').val(assist.marcas[params.index].nota);
    } else {
      $('#change-log').val('');
    }

    $('#modal-edit-value').modal('show');

    var text = e.currentTarget.innerText;
    if (text.charAt(0) == ' ') {
      text = '';
      $('#invalid-checkbox-section').hide();
    } else {
      $('#invalid-checkbox-section').show();
    }
		console.log(text);
    $('#assist-time').val(text);
  },
  'click #btn-print': function (e) {
    e.preventDefault();
    var bioId = Number(Router.current().params.bioId);
    var periodo = Number(Router.current().params.month) + "/" + Router.current().params.year
    Meteor.call('ObtenerPDF', 'simen', 'asistencia', {
      "periodo": periodo,
      "bioId": bioId
    }, function (err, res) {
      var dl = document.createElement("a");
      dl.href = "data:application/pdf;base64, " + res;
      var userProfile = Meteor.users.findOne({
        "profile.bioId": bioId
      }).profile;
      dl.download = "asistencia_" + periodo + "_" + Normalizar(
          (userProfile.nombres + " " + userProfile.apellidos)
              .toLowerCase()
              .replace(/ /g, "_"));
      document.body.appendChild(dl);
      dl.click();
      document.body.removeChild(dl);
    });
  },
  'click .detail-calendar-day': function (e) {
    e.preventDefault();
    if (Meteor.user().profile.role == 6) return false
    var trabajador = Meteor.users.findOne({
      "profile.bioId": Number(Router.current().params.bioId)
    })
    var id = e.currentTarget.id;
    var doc = {
      month: Number(id.split('-')[1]),
      day: Number(id.split('-')[0]),
      year: Number(id.split('-')[2]),
      userId: trabajador._id
    };
    var assist = Asistencias.findOne(doc);
    if (assist && assist.nota) {
      $('#change-log').val(assist.nota);
    } else {
      $('#change-log').val('');
    }
    if (assist && assist.tiponota) {
      doc.tiponota = assist.tiponota;
    }
    doc.isGlobal = true;
    Session.set('MarcationParams', doc);
    $('#modal-edit-value').modal('show');
  },
  'click .btn-vacacion': function (e) {
    e.preventDefault()
    var id = e.currentTarget.id;
    var trabajador = Meteor.users.findOne({
      "profile.bioId": Number(Router.current().params.bioId)
    });
    var doc = {
      month: Number(id.split('-')[1]),
      day: Number(id.split('-')[0]),
      year: Number(id.split('-')[2]),
      userId: trabajador._id
    };
    var assist = Asistencias.findOne(doc);
    if (!assist) {
      doc.vacacion = true;      
      Meteor.call("ProcesarCambioAsistencia", false, {
        $set: doc
      });
    } else {
      var doc = assist.vacacion ? {
        $unset: {
          vacacion: ""
        }
      } : {
        $set: {
          vacacion: true,          
        },
        $unset: {
          licencia: 1
        }
      };
      Meteor.call("ProcesarCambioAsistencia", assist._id, doc);
    }
  },
  'click .btn-licencia': function (e) {
    e.preventDefault()
    var id = e.currentTarget.id;
    var trabajador = Meteor.users.findOne({
      "profile.bioId": Number(Router.current().params.bioId)
    });
    var doc = {
      month: Number(id.split('-')[1]),
      day: Number(id.split('-')[0]),
      year: Number(id.split('-')[2]),
      userId: trabajador._id
    };
    var assist = Asistencias.findOne(doc);
    if (!assist) {
      doc.licencia = true;
      Meteor.call("ProcesarCambioAsistencia", false, {
        $set: doc
      });
    } else {
      var doc = assist.licencia ? {
        $unset: {
          licencia: 1
        }
      } : {
        $set: {
          licencia: true,          
        },  
        $unset: { 
          vacacion: 1 
        }
      };
      Meteor.call("ProcesarCambioAsistencia", assist._id, doc);
    }
  },
  'click .btn-llenar-jornada': function (e) {
    e.preventDefault()
    var id = e.currentTarget.id;
    var trabajador = Meteor.users.findOne({
      "profile.bioId": Number(Router.current().params.bioId)
    });
    var doc = {
      month: Number(id.split('-')[1]),
      day: Number(id.split('-')[0]),
      year: Number(id.split('-')[2]),
      userId: trabajador._id
    };
    Meteor.call("LlenarAsistencia", doc);
  },
  "focusout #textarea-observacion": function () {
    var obs = $('#textarea-observacion').val();
    var user = Meteor.users.findOne({
      "profile.bioId": Number(Router.current().params.bioId)
    })
    var libro = user.profile.libro
    var aparams = Session.get('AssistanceParams');
    if (!aparams) return null;
    if (!libro) {
      libro = [{
        "periodo": aparams,
        observacion: obs
            }]
    } else {
      hoja = libro.filter(function (periodo) {
        return periodo === aparams
      })
      libro.splice(hoja, 1)
      libro.push({
        periodo: aparams,
        observacion: obs
      })
    }

    Meteor.call("ActualizarLibro",
      user._id, {
        $set: {
          "profile.libro": libro
        }
      },
      function (err, resp) {
        if (!err) {
          Session.set("ImportMessages", {
            success: [{
              item: "Observación actualizada"
                        }]
          });
          setTimeout(function () {
            $(".marco-mensajes").fadeOut();
            Session.set("ImportMessages", false);
          }, 3000);
        }
      })
  }
})
