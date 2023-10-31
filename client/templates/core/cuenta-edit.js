import { FormUtils } from "../../lib/utils";

var hayErrores = function () {
  var msgs = {
    danger: [],
  };
  if (_.isEmpty($("#cuenta-nombres").val())) {
    msgs.danger.push({
      item: "NOMBRES son requeridos",
    });
  }
  if (_.isEmpty($("#cuenta-apellidos").val())) {
    msgs.danger.push({
      item: "APELLIDOS es requerido",
    });
  }
  if (_.isEmpty($("#cuenta-email").val())) {
    msgs.danger.push({
      item: "EMAIL es requerido",
    });
  }
  if (Session.get("RolSeleccionado") == 6) {
    if (_.isEmpty($("#cuenta-bioId").val())) {
      msgs.danger.push({
        item: "ID biométrico es requerido",
      });
    } else {
      if (!isNaN(Number($("#cuenta-bioId").val()))) {
        Meteor.users
          .find({
            "profile.role": {
              $in: [6, 7],
            },
          })
          .forEach(function (o) {
            if (
              o._id != Session.get("UsrSel")._id &&
              o.profile.bioId == Number($("#cuenta-bioId").val())
            ) {
              msgs.danger.push({
                item: "ID biométrico ya registrado a " + o.profile.name,
              });
            }
          });
      } else {
        msgs.danger.push({
          item: "ID biométrico debe ser numérico",
        });
      }
    }
  }

  if (
    !/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      $("#cuenta-email").val()
    )
  ) {
    msgs.danger.push({
      item: "EMAIL mal formado",
    });
  }
  if (!_.isEmpty(msgs.danger)) {
    $("#cuenta-password").attr("disabled", "disabled");
    $("#cuenta-repassword").attr("disabled", "disabled");
  } else {
    $("#cuenta-password").removeAttr("disabled");
    $("#cuenta-repassword").removeAttr("disabled");
    if ($("#cuenta-password").val() != $("#cuenta-repassword").val()) {
      msgs.danger.push({
        item: "Ambos PASSWORDS deben coincidir",
      });
    }
  }
  Session.set("ImportMessages", msgs);
  return !_.isEmpty(msgs.danger);
};

Template.cuentaEdit.rendered = function () {
  Session.set("ImportMessages", false);
};

Template.cuentaEdit.destroyed = function () {
  delete Session.keys["ImporMessages"];
};

Template.cuentaEdit.helpers({
  esAdmin: function () {
    const usuario = Meteor.user();
    return usuario?.profile?.role == 1;
  },
  esTrabajador: function () {
    return Session.get("RolSeleccionado") == 6;
  },
  desvinculado: function () {
    return Session.get("RolSeleccionado") == 7;
  },
  esCliente: function () {
    return Session.get("RolSeleccionado") == 3;
  },
  cuentaSel: function () {
    return Session.get("UsrSel");
  },
  messages: function () {
    return Session.get("ImportMessages");
  },
  nombreRol: function () {
    var rolSel = Session.get("RolSeleccionado");
    return NOMBRES_ROLES(rolSel);
  },
  profile: function () {
    return Meteor.user() ? Meteor.user().profile : {};
  },
});

Template.cuentaEdit.events({
  "change #cuenta-bioId": function (e) {
    hayErrores();
  },
  "keyup .form-control": function (e) {
    hayErrores();
  },
  "click #btn-guardar": function (e) {
    if (hayErrores()) return;
    let rolActual = Session.get("RolSeleccionado");
    let docSet = {
        profile: {},
      },
      docUnset = {
        profile: {},
      };
    const usuario = Session.get("UsrSel");
    const validacion = FormUtils.getFields(".formulario");
    console.log("VALIDACION", validacion);

    if (rolActual == 6 && $("#checkbox-desvincular").is(":checked")) {
      rolActual = 7;
    }
    if (rolActual == 7 && $("#checkbox-reintegrar").is(":checked")) {
      rolActual = 6;
    }
    validacion.role = rolActual;

    console.log("RESULTADOS", validacion);

    if (usuario._id && !_.isEmpty($("#cuenta-password").val())) {
      Meteor.call(
        "ActualizarPassword",
        usuario._id,
        $("#cuenta-password").val(),
        function (err, resp) {
          if (err) {
            Session.set("ImportMessages", {
              danger: [
                {
                  item: resp,
                },
              ],
            });
          } else {
            Session.set("ImportMessages", {
              success: [
                {
                  item: "Password actualizado correctamente",
                },
              ],
            });
          }
        }
      );
    }

    Meteor.call(
      "ActualizarUsuario",
      usuario._id,
      validacion,
      function (err, resp) {
        if (err) {
          Session.set("ImportMessages", {
            danger: [
              {
                item: err,
              },
            ],
          });
        } else {
          Session.set("ImportMessages", {
            success: [
              {
                item: "Datos actualizados",
              },
            ],
          });
          var usuario = Session.get("UsrSel");
          usuario._id = resp;
          setTimeout(function () {
            Session.set("ImportMessages", []);
          }, 5000);
        }
      }
    );
  },
  "click .btn-cancelar": function (e) {
    Router.go("/cuentas");
  },
});
