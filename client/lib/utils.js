export const VERSION = "2.0";

export const IsEmpty = (valor) => {
  return (
    valor == "" ||
    valor == undefined ||
    (Object.keys(valor).length === 0 && valor.constructor === Object)
  );
};

export const UIUtils = {
  toggleVisible: (global, selector) => {
    var elementos = document.querySelectorAll("." + global);
    for (var i = 0; i < elementos.length; i++) {
      elementos[i].style.display = "none";
    }
    document.querySelector("." + global + "." + selector).style.display =
      "block";
  },
  toggleClass: (global, selector, clase) => {
    var elementos = document.querySelectorAll("." + global);
    for (var i = 0; i < elementos.length; i++) {
      elementos[i].classList.remove(clase);
    }
    document.querySelector("." + global + "." + selector).classList.add(clase);
  },
  toggle: (selector, clase) => {
    var elementos = document.querySelectorAll("." + selector);
    for (var i = 0; i < elementos.length; i++) {
      elementos[i].classList.toggle(clase);
    }
  },
};
// este ulilitario recibe y recorre el formulario ,luego  lo deja en un arreglo Json doc.
export const FormUtils = {
  getFields: (selectorPrincipal) => {
    let doc = {};
    $(
      (selectorPrincipal ? selectorPrincipal + " " : "") +
        ".form-group .form-control"
    ).each((indice, campo) => {
      const id = campo.id;
      const nombreCampo = id.split("-")[1];
      const tipo = campo.attributes["type"].value;
      const clases = campo.classList.value;
      if (clases && clases.indexOf("datetime-componente") != -1) {
        doc[nombreCampo] = moment(campo.value, "DD/MM/YYYY").toDate();
      } else if (tipo == "number") {
        doc[nombreCampo] = Number(campo.value);
      } else {
        doc[nombreCampo] = campo.value;
      }
    });
    $(".formulario .caluga").each((indice, campo) => {
      const seleccionado = campo.classList.value.indexOf("seleccionado") != -1;
      if (seleccionado) {
        if (!doc.calugas) {
          doc.calugas = [];
        }
        doc.calugas.push(campo.innerHTML);
      }
    });
    $(".formulario .checkboxes [type='checkbox']:checked").each(
      (indice, campo) => {
        if (!doc[campo.attributes["name"].value]) {
          doc[campo.attributes["name"].value] = "";
        }
        doc[campo.attributes["name"].value] +=
          campo.value +
          (indice <
          $(".formulario .checkboxes [type='checkbox']:checked").length - 1
            ? ","
            : "");
      }
    );
    console.log(doc);
    return doc;
  },
  invalid(selectorPrincipal) {
    let doc = {};
    $(
      (selectorPrincipal ? selectorPrincipal + " " : "") + ".formulario .campo"
    ).each((indice, campo) => {
      const id = campo.id;
      const required = campo.attributes["required"];
      if (required) {
        const etiqueta = campo.attributes["aria-label"].value;
        if (IsEmpty(campo.value)) {
          const nombreCampo = id.split("-")[1];
          doc[nombreCampo] = etiqueta + " es requerido";
        }
      }
    });
    if (IsEmpty(doc)) {
      return false;
    }
    return doc;
  },
};

export const MaskPrice = function (str, moneda) {
  var parts = (str + "").split("."),
    main = parts[0],
    len = main.length,
    output = "",
    i = len - 1;

  while (i >= 0) {
    output = main.charAt(i) + output;
    if ((len - i) % 3 === 0 && i > 0) {
      output = "." + output;
    }
    --i;
  }
  // put decimal part back
  if (moneda == "UF $" && parts.length > 1) {
    output += "," + parts[1].substr(0, 2);
  }
  return (moneda ? moneda + " " : "") + output;
};
