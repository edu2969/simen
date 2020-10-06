const { Base64Encode } = Npm.require('base64-stream');
var Future = Npm.require('fibers/future');
var PDFKit = Npm.require('pdfkit');
var XLSX = Npm.require('xlsx');

FabricaPDFs = function (identificador, tipo, parametros) {
	var doc;

	switch (tipo) {
		case "cotizacion":
			doc = PDFCotizaciones(parametros.cotizacionId);
			break;
		case "asistencia":
			doc = new PDFKit({
				size: 'Letter',
				margins: {
					top: 50,
					bottom: 0,
					left: 50,
					right: 50,
				}
			});
			var bioId = parametros.bioId;
			if (parametros.bioId == -1) {
				Meteor.users.find({
					"profile.role": 6,
					"profile.prioridad": {
						$exists: true
					}
				}, {
					sort: {
						"profile.prioridad": 1
					}
				}).forEach(function (u, indice) {
					doc = PDFAsistenciasTrabajador(doc, {
						periodo: parametros.periodo,
						bioId: u.profile.bioId
					});
					if ((indice + 1) < Meteor.users.find({
							"profile.role": 6,
							"profile.prioridad": {
								$exists: true
							}
						}).count()) {
						doc.addPage();
					}
				});
			} else {
				doc = PDFAsistenciasTrabajador(doc, parametros);
			}
			break;
		case "libromenor":
			doc = PDFLibroMenor(parametros);
			break;
	}

	var future = new Future();
	var finalString = "";
	var stream = doc.pipe(new Base64Encode());
	doc.end();
	stream.on('data', function (chunk) {
		finalString += chunk;
	});

	stream.on('end', Meteor.bindEnvironment(function () {
		future.return(finalString);
	}));

	return future.wait();
}

PDFCotizaciones = function (cId) {
	if (!cId) return;
	//console.log('Renderizando cotizacion: ' + cId);
	var cotizacion = Cotizaciones.findOne({
		_id: cId
	});
	var atencion = Meteor.users.findOne(cotizacion.vendedorId);
	var empresaOrigen = Empresas.findOne({
		_id: cotizacion.empresaId
	});
	var rolAtencion = Equipos.findOne({
		usuarioId: atencion._id,
		empresaId: empresaOrigen._id
	}).rol;
	var cliente = Empresas.findOne({
		_id: cotizacion.clienteId
	});

	var doc = new PDFKit({
		size: 'Letter',
		margins: {
			top: 50,
			bottom: 0,
			left: 50,
			right: 50,
		}
	});

	var basePath = process.cwd() + '/../web.browser/app/';
	var fontNormal = basePath + "/font/helveticaneue.ttf",
		fontBold = basePath + "/font/helvetica-neue-bold.ttf";
	var logoPDF = basePath + "img/logo-simen-pdf.png";

	// **********************************
	//
	// Portada
	var pagina = 1;
	var d = cotizacion.fecha;

	var ceros = '';
	for (var i = 0; i < 12 - cotizacion.numero.toString().length; i++) {
		ceros = ceros.concat('0');
	}


	doc.fontSize(22).fillColor('#3C3C3B');

	//*************************************
	//
	doc.image(logo, 50, 30, {
		align: 'right',
		width: 106
	});
	doc.fontSize(10).fillColor("#3C3C3B");
	doc.text(DayNames[d.getDay()] + ' ' + d.getDate() + ' de ' + MonthNames[d.getMonth()] + ', ' + d.getFullYear(),
		350, 30, {
			align: 'right',
			width: 200
		});

	doc.fontSize(11).fillColor("#3C3C3B");
	doc.text('Oferta Nº ' + ceros + cotizacion.numero, 50, 52, {
		width: 500,
		align: "right"
	});
	doc.rect(50, 120, 500, 2).fill('#42A5F5', 'even-odd');
	doc.fontSize(16).font(fontNormal).fillColor('#084355');
	doc.text(cliente.contactoNombre, 50, 100, {
		align: 'left',
		width: 500
	});

	var col48 = 10.5;
	var baseHsize = 22;
	var hsize = 22;
	var textPadding = 7;
	var top = 100;


	// ENCABEZADO SIMEN
	doc.fontSize(22).font(fontBold);
	doc.text("COTIZACIÓN", 50, 70, {
		align: 'center',
		width: 500
	});
	doc.font(fontNormal).fontSize(10);
	doc.lineWidth(1);
	doc.lineJoin('miter').rect(50, top + hsize * 0, col48 * 48, hsize).stroke();
	doc.lineJoin('miter').rect(50, top + hsize * 1, col48 * 48, hsize).stroke();
	doc.lineJoin('miter').rect(50, top + hsize * 2, col48 * 48, hsize).stroke();
	doc.lineJoin('miter').rect(50, top + hsize * 3, col48 * 48, hsize).stroke();
	if (!_.isEmpty(cliente.contactoNombreCC)) {
		doc.lineJoin('miter').rect(50, top + hsize * 4, col48 * 48, hsize).stroke();
	}

	doc.text("Sres", 50 + textPadding, top + textPadding + hsize * 0);
	doc.text("At. " + cliente.atencion, 50 + textPadding, top + textPadding + hsize * 1);
	if (!_.isEmpty(cliente.contactoNombreCC)) {
		doc.text("CC. " + cliente.atencionCC, 50 + textPadding, top + textPadding + hsize * 2);
	}
	doc.text("De", 50 + textPadding, top + textPadding + hsize * (_.isEmpty(cliente.contactoNombreCC) ? 2 : 3));
	doc.text("Ref.", 50 + textPadding, top + textPadding + hsize * (_.isEmpty(cliente.contactoNombreCC) ? 3 : 4));

	doc.text(": " + cliente.razon, 100, top + textPadding + hsize * 0);

	doc.text(": " + cliente.contactoNombre, 100, top + textPadding + hsize * 1);
	if (!_.isEmpty(cliente.contactoNombreCC)) {
		doc.text(": " + cliente.contactoNombreCC, 100, top + textPadding + hsize * 2);
	}
	doc.text(": Diego Mendoza. Cel +56 9 9886 7623", 100, top + textPadding + hsize * (_.isEmpty(cliente.contactoNombreCC) ? 2 : 3));
	doc.text(": " + cotizacion.referencia, 100, top + textPadding + hsize * (_.isEmpty(cliente.contactoNombreCC) ? 3 : 4));

	doc.text("Estimados Señor(es)", 50, top + textPadding + hsize * (_.isEmpty(cliente.contactoNombreCC) ? 4 : 5) + 15);
	doc.text("Tenemos el agrado de cotizar a UD lo siguiente:", 50, top + textPadding + hsize * (_.isEmpty(cliente.contactoNombreCC) ? 5 : 6) + 8);

	doc.font(fontBold).fontSize(12);
	doc.text(cotizacion.titulo, 50, top + textPadding + hsize * (_.isEmpty(cliente.contactoNombreCC) ? 6 : 7));
	top = top + textPadding + hsize * (_.isEmpty(cliente.contactoNombreCC) ? 7 : 8);


	doc.font(fontNormal);
	doc.lineWidth(1);
	doc.lineJoin('miter').rect(50, top, col48 * 2, hsize * 1.5).stroke();
	doc.lineJoin('miter').rect(50 + col48 * 2, top, col48 * 4, hsize * 1.5).stroke();
	doc.lineJoin('miter').rect(50 + col48 * 6, top, col48 * 5, hsize * 1.5).stroke();
	doc.lineJoin('miter').rect(50 + col48 * 11, top, col48 * 21, hsize * 1.5).stroke();
	doc.lineJoin('miter').rect(50 + col48 * 32, top, col48 * 8, hsize * 1.5).stroke();
	doc.lineJoin('miter').rect(50 + col48 * 40, top, col48 * 8, hsize * 1.5).stroke();

	doc.fontSize(10).fillColor('#777');
	doc.text('Nº', 46 + textPadding, top + textPadding, {
		align: 'center',
		width: col48 * 2 - textPadding
	});
	doc.text('CANT', 50 + col48 * 2 + textPadding, top + textPadding);
	doc.text('CÓDIGO', 50 + col48 * 6 + textPadding, top + textPadding);
	doc.text('DESCRIPCIÓN\nPRODUCTO Y/O SERVICIO', 50 + col48 * 11 + textPadding, top + textPadding);
	doc.text('VALOR\nUNIT', 50 + col48 * 32 + textPadding, top + textPadding);
	doc.text('TOTAL\nITEM', 50 + col48 * 40 + textPadding, top + textPadding);

	top = top + hsize * 1.5;

	var items = Items.find({
		cotizacionId: cotizacion._id
	});
	var cantidad = 1,
		total = 0,
		moneda,
		numeroItem = 1;

	doc.fill('#3C3C3B');
	items.forEach(function (item) {
		if (!moneda) moneda = item.moneda;
		if (_.isEmpty(item.descripcion)) item.descripcion = "";
		var titulo = item.descripcion.includes("#") ? item.descripcion.split("#")[0] : false;
		var descripcion = item.descripcion.includes("#") ? item.descripcion.split("#")[1] : item.descripcion;
		var upperCount = descripcion.replace(/[^A-Z,0-9]/g, "").length;
		var lowerCount = descripcion.length - upperCount;
		var nameHeight = Math.floor((upperCount * 1.4 + lowerCount) / 70) + 1;

		hsize = baseHsize * nameHeight;


		// ITEMS-SIMEN
		hsize = 22;
		var lineas = item.descripcion.split("\n");
		var alturaTotal = 0;
		var topCeldas = top + hsize * .6 * cantidad - textPadding * 2 + 1;
		var lineaSuperior = topCeldas;
		for (var i = 0; i < lineas.length; i++) {
			var uc = (i == 0 ? lineas[i] : lineas[i].replace("- ", "")).replace(/[^A-Z,0-9]/g, "").length;
			var lc = (i == 0 ? lineas[i] : lineas[i].replace("- ", "")).length - uc;
			var relacion = (uc * 6.2 + lc * 5.2 - textPadding * 2 - (i == 0 ? 0 : 20)) / (col48 * 21 - textPadding * 2 - (i == 0 ? 0 : 20));
			var altura = 1 + Math.floor(relacion);
			doc.font(i == 0 ? fontBold : fontNormal).fontSize(10);
			doc.text(i == 0 ? lineas[i] : lineas[i].replace("- ", ""),
				(i == 0 ? 50 : 70) + textPadding + col48 * 11, lineaSuperior + (lineas.length > 1 ? 4 : textPadding), {
					align: 'left',
					width: col48 * 21 - textPadding * 2 - (i == 0 ? 0 : 10)
				});
			if (i > 0) {
				doc.text("- ", 50 + textPadding + col48 * 11, lineaSuperior + (lineas.length > 1 ? 4 : textPadding), {
					align: 'left',
					width: col48 * 21 - textPadding * 2 - (i == 0 ? 0 : 20)
				});
			}
			lineaSuperior = lineaSuperior + altura * hsize * .6 + textPadding * (i == 0 ? 1 : 0);
			alturaTotal = alturaTotal + altura;
			//console.log(uc, lc, altura, lineaSuperior, alturaTotal, lineas[i], relacion);
		}

		doc.fontSize(10);

		doc.text(numeroItem++, 50 + textPadding, topCeldas + textPadding, {
			align: 'center',
			width: col48 * 2 - textPadding * 2
		});
		doc.text(item.cantidad,
			44 + textPadding + col48 * 2, topCeldas + textPadding, {
				align: 'center',
				width: col48 * 4
			});
		var subcategoria = Categorias.findOne({
			_id: item.subcategoriaId
		});
		doc.text(subcategoria ? subcategoria.codigo : "XXX",
			50 + textPadding + col48 * 6, topCeldas + textPadding);

		doc.text(item.moneda,
			50 + textPadding + col48 * 32, topCeldas + textPadding);

		doc.text(MaskPrice(item.valor, ""),
			50 + textPadding + col48 * 32, topCeldas + textPadding, {
				align: 'right',
				width: col48 * 8 - textPadding * 2
			});

		doc.text(moneda,
			50 + textPadding + col48 * 40, topCeldas + textPadding);

		doc.text(MaskPrice(item.valor * item.cantidad, item.moneda),
			50 + textPadding + col48 * 40, topCeldas + textPadding, {
				align: 'right',
				width: col48 * 8 - textPadding * 2
			});

		doc.lineJoin('miter').rect(50, topCeldas, col48 * 2, alturaTotal * hsize * .6 + textPadding * 2).stroke();
		doc.lineJoin('miter').rect(50 + col48 * 2, topCeldas, col48 * 4, alturaTotal * hsize * .6 + textPadding * 2).stroke();
		doc.lineJoin('miter').rect(50 + col48 * 6, topCeldas, col48 * 5, alturaTotal * hsize * .6 + textPadding * 2).stroke();
		doc.lineJoin('miter').rect(50 + col48 * 11, topCeldas, col48 * 21, alturaTotal * hsize * .6 + textPadding * 2).stroke();
		doc.lineJoin('miter').rect(50 + col48 * 32, topCeldas, col48 * 8, alturaTotal * hsize * .6 + textPadding * 2).stroke();
		doc.lineJoin('miter').rect(50 + col48 * 40, topCeldas, col48 * 8, alturaTotal * hsize * .6 + textPadding * 2).stroke();

		top = topCeldas + alturaTotal * hsize * .6 + textPadding * 2;

		// Agrega una nueva página
		if (top > 800) {
			// Pié de página
			doc.fontSize(12).fillColor('#95a5a6');
			doc.text('visítenos en:', 50, 741);
			doc.fontSize(12).fillColor('#1155CC');
			doc.text(empresaOrigen.razon, 122, 741);
			doc.fontSize(12).fillColor('#95a5a6');
			doc.text('Página ' + pagina++, 354, 741, {
				align: 'right',
				width: 196
			});

			doc.addPage();
			doc.image(logo, 50, 30, {
				align: 'right',
				width: 106
			});

			doc.fontSize(10).fillColor('#084355');
			doc.text(DayNames[d.getDay()] + ' ' + d.getDate() + ' de ' + MonthNames[d.getMonth()] + ', ' + d.getFullYear(),
				350, 30, {
					align: 'right',
					width: 200
				});

			doc.rect(50, top, col48 * 1 - 1, hsize - 1).fill('#22829f', 'even-odd');
			doc.rect(50 + col48 * 1, top, col48 * 2 - 1, hsize - 1).fill('#22829f', 'even-odd');
			doc.rect(50 + col48 * 3, top, col48 * 4 - 1, hsize - 1).fill('#22829f', 'even-odd');
			doc.rect(50 + col48 * 7, top, col48 * 9 - 1, hsize - 1).fill('#22829f', 'even-odd');
			doc.rect(50 + col48 * 16, top, col48 * 4 - 2, hsize - 1).fill('#22829f', 'even-odd');
			doc.rect(50 + col48 * 20, top, col48 * 4, hsize - 1).fill('#22829f', 'even-odd');

			// Item	Cantidad	Descripción		Precio Unitario	Valor Item
			doc.fontSize(10).fillColor('white');
			doc.text('Nº', 46 + textPadding, top + textPadding, {
				align: 'center',
				width: col48 * 1 - textPadding
			});
			doc.text('Cant', 50 + col48 * 1 + textPadding, top + textPadding);
			doc.text('Código', 50 + col48 * 3 + textPadding, top + textPadding);
			doc.text('Descripción', 50 + col48 * 7 + textPadding, top + textPadding);
			doc.text('Valor Unidad', 50 + col48 * 16 + textPadding, top + textPadding);
			doc.text('Total Item', 50 + col48 * 20 + textPadding, top + textPadding);
			cantidad = 2;
		}

		total += item.valor * item.cantidad;

	});

	var hsize = baseHsize;
	var conIva = total * 1.19;
	var iva = total * 0.19;

	// TOTALES OTROS
	top = top - hsize;
	hsize = 22;
	doc.lineJoin('miter').rect(50, top + hsize * (cantidad + 0), col48 * 40, hsize).stroke();
	doc.lineJoin('miter').rect(50, top + hsize * (cantidad + 1), col48 * 40, hsize).stroke();
	doc.lineJoin('miter').rect(50, top + hsize * (cantidad + 2), col48 * 40, hsize).stroke();
	doc.lineJoin('miter').rect(50 + col48 * 40, top + hsize * (cantidad + 0), col48 * 8, hsize).stroke();
	doc.lineJoin('miter').rect(50 + col48 * 40, top + hsize * (cantidad + 1), col48 * 8, hsize).stroke();
	doc.lineJoin('miter').rect(50 + col48 * 40, top + hsize * (cantidad + 2), col48 * 8, hsize).stroke();

	doc.font(fontBold).fontSize(11).fillColor('#3C3C3B');
	doc.text('NETO', 50, top + hsize * (cantidad + 0) + textPadding / 2, {
		align: 'right',
		width: col48 * 40 - textPadding
	});
	doc.text(moneda, 50 + col48 * 40 + textPadding, top + hsize * (cantidad + 0) + textPadding / 2);
	doc.text(MaskPrice(total, ""), 50 + col48 * 40 + textPadding, top + hsize * (cantidad + 0) + textPadding / 2, {
		align: 'right',
		width: col48 * 8 - textPadding * 2
	});

	doc.text('IVA (19%)', 50, top + hsize * (cantidad + 1) + textPadding / 2, {
		align: 'right',
		width: col48 * 40 - textPadding
	});
	doc.text(moneda, 50 + col48 * 40 + textPadding, top + hsize * (cantidad + 1) + textPadding / 2);
	doc.text(MaskPrice(iva, ""), 50 + col48 * 40 + textPadding / 2, top + hsize * (cantidad + 1) + textPadding / 2, {
		align: 'right',
		width: col48 * 8 - textPadding * 2
	});

	doc.text('TOTAL', 50, top + hsize * (cantidad + 2) + textPadding / 2, {
		align: 'right',
		width: col48 * 40 - textPadding
	});
	doc.text(moneda, 50 + col48 * 40 + textPadding, top + hsize * (cantidad + 2) + textPadding / 2);
	doc.text(MaskPrice(conIva, ""), 50 + col48 * 40 + textPadding, top + hsize * (cantidad + 2) + textPadding / 2, {
		align: 'right',
		width: col48 * 8 - textPadding * 2
	});

	top = top + hsize * (cantidad + 4);

	if (cotizacion.nota) {
		doc.font(fontNormal).fontSize(9)
			.text("Notas:", 50, top, {
				width: col48 * 48 - textPadding * 2
			})
			.text(cotizacion.nota, 50, top + 16, {
				width: col48 * 48 - textPadding * 2
			});
	}


	top = top + 10;
	if (cotizacion.nota) {
		doc.fontSize(14).font(fontBold).fillColor('#084355');
		doc.text("Notas", 30 + col48 * 1, top);
		doc.rect(30 + col48 * 1, top + 20, 500, 2).fill('#42A5F5', 'even-odd');
		doc.text(cotizacion.nota, 50, top + hsize * (cantidad + 4));
		top = top + 42;
	}

	// Pié de página
	if (!_.isEmpty(empresaOrigen.url)) {
		doc.fontSize(12).font(fontNormal).fillColor('#95a5a6');
		doc.text('visítenos en:', 50, 741);
		doc.fontSize(12).fillColor('#1155CC');
		doc.text(empresaOrigen.url, 122, 741);
	}
	doc.fontSize(12).fillColor('#95a5a6');
	doc.text('Página ' + pagina++, 354, 741, {
		align: 'right',
		width: 196
	});



	//************************************************
	//
	// Condiciones
	doc.addPage();
	doc.image(logo, 50, 30, {
		align: 'right',
		width: 106
	});
	doc.fontSize(10).font(fontNormal).fillColor('#3C3C3B');
	doc.text(DayNames[d.getDay()] + ' ' + d.getDate() + ' de ' + MonthNames[d.getMonth()] + ', ' + d.getFullYear(),
		350, 30, {
			align: 'right',
			width: 200
		});

	doc.fontSize(11).fillColor("#3C3C3B");
	doc.text('Oferta Nº ' + ceros + cotizacion.numero, 50, 52, {
		width: 500,
		align: "right"
	});


	// CONDICIONES simen
	var tc = 86;
	doc.lineJoin('miter').rect(46, tc, 512, 20).stroke();
	doc.lineJoin('miter').rect(46, tc + 20, 512, 20).stroke();
	doc.lineJoin('miter').rect(46, tc + 40, 512, 60).stroke();
	doc.lineJoin('miter').rect(46, tc + 100, 512, 20).stroke();
	doc.lineJoin('miter').rect(46, tc + 120, 512, 20).stroke();
	doc.lineJoin('miter').rect(46, tc + 140, 512, 40).stroke();
	doc.lineJoin('miter').rect(46, tc + 180, 512, 20).stroke();


	var topeTmp = 188;

	// Titulos
	doc.fontSize(11).font(fontBold).fillColor(empresaOrigen.identificador.includes("tyt") ? '#084355' : '#3C3C3B');
	doc.text('Condiciones Comerciales', 50, 89);
	doc.fontSize(10).font(fontBold).fillColor(empresaOrigen.identificador.includes("tyt") ? '#084355' : '#3C3C3B');
	doc.text('Forma de Pago', 50, 110);
	doc.text('Plazo de entrega', 50, topeTmp);
	doc.text('Lugar de entrega', 50, topeTmp + 20);
	doc.text('Garantías', 50, topeTmp + 40);
	doc.text('Validez de la oferta', 50, topeTmp + 80, {
		width: 110
	});
	doc.text('Término y condiciones generales de venta', 50, topeTmp + 122);
	doc.text('Multas', 50, topeTmp + 220);
	doc.text('Garantías', 50, topeTmp + 250);
	doc.text('Servicios', 50, topeTmp + 280);
	doc.text('Cambios, anulaciones, devoluciones', 50, topeTmp + 330, {
		width: 110
	});

	// Descripciones
	doc.font(fontNormal);
	doc.text(cotizacion.pago, 170, 112);
	doc.text(cotizacion.plazo, 170, topeTmp + 4);
	doc.text('En instalaciones dispuestas por el cliente', 170, topeTmp + 24);
	doc.text(cotizacion.garantia + ' a partir de fecha de entrega, por fallas ' + 'de fabricación imputables a fabricante. ' + 'Esta caduca automáticamente si los equipos ' + 'son intervenidos durante este periodo o no se ' + 'respetan las indicaciones del fabricante.', 170, topeTmp + 44);
	doc.text('10 dias a partir de fecha indicada en la presente cotización', 170, topeTmp + 84);
	doc.text('En caso de ser favorecidos con vuestro pedido, favor ' + 'emitir su Orden de Compra a nombre de ', 50, topeTmp + 142);
	doc.text('No se aceptarán multas ni retenciones de ningún tipo' + ' sin acuerdo previo entre las partes.', 170, topeTmp + 224);

	doc.text('Los servicios de garantía serán prestados en laboratorios de ' + empresaOrigen.razon + ' siendo los cargos de traslado, ' + 'hacia y desde el sitio indicado, de parte del Cliente', 170, topeTmp + 254);

	doc.text('La presente oferta no incluye servicios de montaje de ningún tipo, ' + 'a excepción de los expresamente indicados en la oferta. ' + 'Los costos de puesta en servicio del equipamiento cotizado ' + 'serán cargados al cliente de acuerdo a los procedimientos que ' + empresaOrigen.razon + ' establece para tales efectos.', 170, topeTmp + 284);

	doc.text('Una vez aceptada en conformidad la orden de compra por parte de ' + empresaOrigen.razon + ', cualquier cambio, anulación, cancelación ' + 'o devolución de productos, por parte del cliente, podrá generar ' + 'cargos, los cuales deberán ser asumidos por el cliente.', 170, topeTmp + 332);

	doc.font(fontBold);
	var tcu = 128;
	doc.text(empresaOrigen.razon, 50, tcu, {
		width: 500,
		align: "center"
	});
	doc.text(cotizacion.cuenta == "1" ? empresaOrigen.banco1 : empresaOrigen.banco2, 50, tcu + 12, {
		width: 500,
		align: "center"
	});
	doc.font(fontNormal);
	doc.text("Cuenta Corriente N° " + cotizacion.cuenta == "1" ? empresaOrigen.cuenta1 : empresaOrigen.cuenta2, 50, tcu + 26, {
		width: 500,
		align: "center"
	});
	doc.text("RUT: " + empresaOrigen.rut, 50, tcu + 38, {
		width: 500,
		align: "center"
	});
	doc.fillColor("#1155CC");
	doc.text(empresaOrigen.contactoEmail, 50, tcu + 48, {
		width: 500,
		align: "center"
	});
	doc.fillColor('#3C3C3B');


	doc.font('Helvetica-Bold').text(empresaOrigen.razon, 50, topeTmp + 158, {
		width: 500,
		align: 'center'
	});
	doc.text(empresaOrigen.rut, 50, topeTmp + 170, {
		width: 500,
		align: 'center'
	});
	doc.text(empresaOrigen.rubro, 50, topeTmp + 182, {
		width: 500,
		align: 'center'
	});
	doc.text(empresaOrigen.direccion, 50, topeTmp + 194, {
		width: 500,
		align: 'center'
	});
	doc.text('Fono: ' + empresaOrigen.telefonos + ' e-mail: ' + empresaOrigen.contactoEmail, 50, topeTmp + 206, {
		width: 500,
		align: 'center'
	});
	doc.fontSize(11);
	doc.text('Otras condiciones', 50, topeTmp + 106);

	// Firma atte
	doc.fontSize(11);
	doc.text("Atte.", 50, topeTmp + 452);
	doc.text("Diego Mendoza V.", 50, topeTmp + 452 + 12);
	doc.text("Gerente.", 50, topeTmp + 452 + 12 * 2);
	doc.text("+56 9 1111 1111", 50, topeTmp + 452 + 12 * 3);
	doc.text("dmendoza@simen.cl", 50, topeTmp + 452 + 12 * 4);



	// Pié de página
	if (!_.isEmpty(empresaOrigen.url)) {
		doc.fontSize(12).font(fontNormal).fillColor('#95a5a6');
		doc.text('visítenos en: ', 50, 741);
		doc.fontSize(12).fillColor('#1155CC');
		doc.text(empresaOrigen.url, 122, 741);
	}
	doc.fontSize(12).fillColor('#95a5a6');
	doc.text('Página ' + pagina++, 354, 741, {
		align: 'right',
		width: 196
	});
	return doc;
}

PDFAsistenciasTrabajador = function (doc, params) {
	var f = moment(params.periodo, "MM/YYYY");

	var user = Meteor.users.findOne({
		"profile.bioId": params.bioId
	});
	var userId = user._id;
	var month = f.month();
	var year = f.year();
	year = year < 1000 ? year + 2000 : year;
	var lastMonthDay = new Date(year, month + 1, 0).getDate();

	var regs = Asistencias.find({
		userId: userId,
		month: month,
		year: year
	});

	if (!regs) {
		console.log('Error: U: ' + user + ' Y: ' + year + ' M: ' + month);
		return;
	}


	var basePath = process.cwd() + '/../web.browser/app/';

	// **********
	//
	// Portada
	var d = new Date();
	doc.image(basePath + 'img/logo-simen.png', 50, 43, {
		width: 173
	});

	doc.fontSize(23).fillColor('#2c3e50');
	doc.text('Reporte de Assistencia', 234, 50);
	doc.fontSize(14);

	doc.text('Periodo ' + MonthNames[month] + ' ' + year +
		(Meteor.user().profile.role != 6 ? ' - ' + user.profile.name : ''), 234, 82)

	var ch = 32;
	var tp = 3;
	var stats = {
		lateDays: 0,
		absentDays: 0,
		noMarked: 0,
		hhNormal: 0,
		hh50: 0,
		hh100: 0,
		totalNormal: 0,
		vacaciones: 0
	};

	for (var i = 1; i <= lastMonthDay; i++) {
		var x = 50 + (i > 15 ? 250 : 0);
		var y = 112 + (i > 15 ? i - 15 : i) * ch;
		var period = new Date(year, month, i);

		var assist = Asistencias.findOne({
			userId: userId,
			day: i,
			month: month,
			year: year
		});

		var reg = {};

		if (!assist) assist = {};
		reg.assistId = assist._id;

		// Es feriado
		reg.isHolyDay = TipoJornada(period) == 1 || TipoJornada(period) == 2;
		reg.isWeekend = period.getDay() == 0 || period.getDay() == 6;
		reg.isMediaJornada = TipoJornada(period) == 3;

		if (reg.isHolyDay || reg.isWeekend) {
			doc.rect(x, y, 245, ch).fill('#bdc3c7');
		} else if (reg.isMediaJornada) {
			doc.rect(x, y, 245, ch).fill('#95a5a6');
		}

		doc.rect(x, y, 245, ch).stroke();
		doc.fontSize(16).fillColor('#2c3e50');
		doc.text(i, x + tp, y + tp);
		doc.fontSize(12);
		var day = DayShortNames[new Date(year, month, i).getDay()];
		doc.text(day, x + tp, y + tp + 15);
		// Es vacacion
		if (assist.vacacion) {
			doc.text("VACACIONES", x + tp + 72, y + tp + 8)
		}

		// marcaciones y estilos
		if (assist.marcas) {
			var marcas = assist.marcas;
			var array = [];
			var isIn = true;

			for (var index = 0; index < marcas.length; index++) {
				var item = new Object();

				if (!marcas[index].invalida) {
					// Feriado o Domingo, HH 100%
					if (reg.isHolyDay || period.getDay() == 0) {
						item.glyphicon = String.fromCharCode(178);
					} else if (marcas[index].ms >= 19 * 60 * 60 * 3600 || period.getDay() == 6) {
						item.glyphicon = String.fromCharCode(185);
					}

					if (index > 0 && marcas[index].ms - marcas[index - 1].ms < 10 * 60 * 3600) {
						item.glyphicon = String.fromCharCode(215);
					} else {
						item.glyphicon = isIn ? String.fromCharCode(171) : String.fromCharCode(187);
						isIn = !isIn;
					}

					if (index > 0 && marcas[marcas.length - 1].ms > 19 * 60 * 60 * 3600 && marcas[index].ms > 18 * 60 * 60 * 3600 && marcas[index].ms < 19 * 60 * 60 * 3600) {
						item.glyphicon = String.fromCharCode(215);
					}

					if (index == 0 && marcas[0].ms > 8 * 60 * 60 * 3600 + 40 * 60 * 3600 && marcas[0].ms < 9 * 60 * 60 * 3600 + 10 * 60 * 3600) {
						item.isLate = true;
						stats.lateDays++;
					}
				}

				item.time = HourFormat(marcas[index].ms);
				item.assistId = reg.assistId;
				item.day = reg.day;
				item.index = index;
				array.push(item);

				doc.fontSize(11);
				if (item.isLate) {
					doc.font('Helvetica-Bold');
				} else {
					doc.font('Helvetica');
				}
				doc.text(item.glyphicon + item.time,
					x + 33 + (index % 4) * 45,
					y + tp + (Math.floor(index / 4)) * 19) + 4;
			}


			reg.marcasView = array;

			if (array.length <= 3 && !reg.isMediaJornada) {
				stats.noMarked++;
			}
		}

		// Horas normales y extras
		if (assist.hhNormal) {
			if (reg.isMediaJornada) {
				reg.hhNormal = assist.hhNormal + 4.5;
			} else {
				reg.hhNormal = assist.hhNormal;
			}
		}
		if (assist.hhExt50) reg.hhExt50 = assist.hhExt50;
		if (assist.hhExt100) reg.hhExt100 = assist.hhExt100;

		// Acumulación de horas
		if (period.getDay() != 0 && period.getDay() != 6 && !reg.isHolyDay) {
			// Otros stats
			if (!reg.marcasView || reg.marcasView.length == 0) {
				if (!assist.vacacion) {
					reg.vacacionable = true;
					stats.absentDays++;
					reg.hhNormal = -9;
				} else {
					stats.vacaciones++;
					//stats.hhNormal = stats.hhNormal + 9;
					reg.hhNormal = 0;
					reg.vacacion = true;
				}
			}
		}
		stats.hhNormal += reg.hhNormal ? reg.hhNormal : 0;
		stats.hh50 += reg.hhExt50 ? reg.hhExt50 : 0;
		stats.hh100 += reg.hhExt100 ? reg.hhExt100 : 0;

		if (reg.hhNormal) {
			doc.rect(x + 208, y, 36, 12).fill('#34495e', 'even-odd')
			doc.fontSize(10).fillColor('#fff')
			if (!assist.vacacion) {
				doc.text('N:' + reg.hhNormal, x + 211, y + 2)
			}
		}

		if (reg.hhExt50) {
			doc.rect(x + 208, y + 10, 36, 12).fill('#34495e', 'even-odd')
			doc.fontSize(10).fillColor('#fff')
			doc.text(String.fromCharCode(189) + ':' + reg.hhExt50, x + 211, y + 12)
		}

		if (reg.hhExt100) {
			doc.rect(x + 208, y + 20, 36, 12).fill('#34495e', 'even-odd')
			doc.fontSize(10).fillColor('#fff')
			doc.text(String.fromCharCode(203) + ':' + reg.hhExt100, x + 211, y + 24)
		}
	}

	stats.total = {
		hhNormal: stats.hhNormal,
		hh50: stats.hh50,
		hh100: stats.hh100
	}

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

	doc.fontSize(11).fillColor('#2c3e50')
	doc.text('Retrasos', 294, 102)
	doc.text(': ' + stats.lateDays, 374, 102)
	doc.text('Inasistencias', 294, 116)
	doc.text(': ' + stats.absentDays, 374, 116)
	doc.text('Vacaciones', 294, 130)
	doc.text(': ' + stats.vacaciones, 374, 130)
	doc.text('HH.Normal', 424, 102)
	doc.text(': ' + stats.hhNormal, 504, 102)
	doc.text('HH.1/2 Ext', 424, 116)
	doc.text(': ' + stats.hh50, 504, 116)
	doc.text('HH.100% Ext', 424, 130)
	doc.text(': ' + stats.hh100, 504, 130)

	doc.rect(50, 102, 78, 40).fill('#bdc3c7', 'even-odd')
	doc.rect(130, 102, 78, 40).fill('#bdc3c7', 'even-odd')
	doc.rect(210, 102, 78, 40).fill('#bdc3c7', 'even-odd')

	doc.fontSize(14).fillColor('#34495e');
	doc.text('HH Norm', 54, 106);
	doc.text('HH ' + String.fromCharCode(189) + 'Ext', 134, 106);
	doc.text('HH Ext', 214, 106);
	doc.font('Helvetica-Bold').fontSize(16).fillColor('#34495e');
	doc.text(Hours2Date(stats.total.hhNormal), 54, 124);
	doc.text(Hours2Date(stats.total.hh50), 134, 124);
	doc.text(Hours2Date(stats.total.hh100), 214, 124);

	if (Meteor.user().profile.role != 6) {
		doc.fontSize(11).fillColor('#2c3e50');
		doc.text('___________________________', 340, 700);
		doc.text('Firma ' + user.profile.name, 340, 716);

		if (user.profile.libro) {
			doc.text(
				'Observaciones: ' + user.profile.libro.filter(
					function (l) {
						return l.periodo = month + "/" + year;
					}).map(function (o) {
					return o.observacion;
				}), 50, 660);
		}
	}
	return doc;
}

PDFLibroMenor = function (params) {
	var f = moment(params.periodo, "MM/YY");

	var cotizaciones = Cotizaciones.find({
		fecha: {
			$gte: f.startOf("month").toDate(),
			$lt: f.endOf("month").toDate()
		}
	}, {
		sort: {
			fecha: 1
		}
	});

	var doc = new PDFKit({
		size: 'Letter',
		margins: {
			top: 50,
			bottom: 0,
			left: 50,
			right: 50,
		}
	});

	var basePath = process.cwd() + '/../web.browser/app/';
	var fontNormal = basePath + "/font/helveticaneue.ttf",
		fontBold = basePath + "/font/helvetica-neue-bold.ttf";

	doc.image(basePath + 'img/logo-simen.png', 50, 43, {
		width: 173
	});
	doc.fontSize(23).fillColor('#2c3e50');
	doc.text('Libro Menor', 234, 50);
	doc.fontSize(14);

	doc.text('Periodo ' + f.format("MMMM YYYY"), 234, 82);

	doc.fontSize(12);
	var col48 = 10.5;
	var indice = 0;
	var tp = 7;
	var altura = 24;
	var top = 132;

	doc.fillColor('#3C3C3B');

	doc.font(fontBold);
	doc.text("N°", 50, top - altura + tp, {
		width: 6 * col48,
		align: "center"
	});
	doc.text("Día", 50 + 6 * col48, top - altura + tp, {
		width: 3 * col48,
		align: "center"
	});
	doc.text("Empresa", 50 + 9 * col48, top - altura + tp, {
		width: 12 * col48,
		align: "center"
	});
	doc.text("Neto", 50 + 21 * col48, top - altura + tp, {
		width: 9 * col48,
		align: "center"
	});
	doc.text("Iva", 50 + 30 * col48, top - altura + tp, {
		width: 9 * col48,
		align: "center"
	});
	doc.text("Total", 50 + 39 * col48, top - altura + tp, {
		width: 9 * col48,
		align: "center"
	});

	doc.lineJoin('miter').rect(50, top - altura, 6 * col48, altura).stroke();
	doc.lineJoin('miter').rect(50 + 6 * col48, top - altura, 3 * col48, altura).stroke();
	doc.lineJoin('miter').rect(50 + 9 * col48, top - altura, 12 * col48, altura).stroke();
	doc.lineJoin('miter').rect(50 + 21 * col48, top - altura, 9 * col48, altura).stroke();
	doc.lineJoin('miter').rect(50 + 30 * col48, top - altura, 9 * col48, altura).stroke();
	doc.lineJoin('miter').rect(50 + 39 * col48, top - altura, 9 * col48, altura).stroke();

	doc.font(fontNormal);
	var neto = 0,
		iva = 0,
		total = 0;
	cotizaciones.forEach(function (c) {
		var empresa = Empresas.findOne({
			_id: c.empresaId
		});
		doc.text(c.numero, 50 + tp, top + altura * indice + tp);
		doc.text(moment(c.fecha).get("date"), 50 + tp + 6 * col48, top + altura * indice + tp);
		doc.text(empresa.razon, 50 + tp + 9 * col48, top + altura * indice + tp);
		doc.text(MaskPrice(c.total * 1.19, '$'), 50 + tp + 21 * col48, top + altura * indice + tp, {
			width: 9 * col48 - 2 * tp,
			align: "right"
		});
		doc.text(MaskPrice(c.total * 0.19, '$'), 50 + tp + 30 * col48, top + altura * indice + tp, {
			width: 9 * col48 - 2 * tp,
			align: "right"
		});
		doc.text(MaskPrice(c.total, '$'), 50 + tp + 39 * col48, top + altura * indice + tp, {
			width: 9 * col48 - 2 * tp,
			align: "right"
		});

		doc.lineJoin('miter').rect(50, top + altura * indice, 6 * col48, altura).stroke();
		doc.lineJoin('miter').rect(50 + 6 * col48, top + altura * indice, 3 * col48, altura).stroke();
		doc.lineJoin('miter').rect(50 + 9 * col48, top + altura * indice, 12 * col48, altura).stroke();
		doc.lineJoin('miter').rect(50 + 21 * col48, top + altura * indice, 9 * col48, altura).stroke();
		doc.lineJoin('miter').rect(50 + 30 * col48, top + altura * indice, 9 * col48, altura).stroke();
		doc.lineJoin('miter').rect(50 + 39 * col48, top + altura * indice, 9 * col48, altura).stroke();

		indice++;

		total += c.total;
		neto += c.total * 1.19;
		iva += c.total * 0.19;
	});

	doc.font(fontBold);
	doc.text("TOTALES", 50, top + indice * altura + tp, {
		width: 6 * col48,
		align: "center"
	});
	doc.text(MaskPrice(neto, "$"), 50 + 21 * col48 + tp, top + indice * altura + tp, {
		width: 9 * col48 - 2 * tp,
		align: "right"
	});
	doc.text(MaskPrice(iva, "$"), 50 + 30 * col48 + tp, top + indice * altura + tp, {
		width: 9 * col48 - 2 * tp,
		align: "right"
	});
	doc.text(MaskPrice(total, "$"), 50 + 39 * col48 + tp, top + indice * altura + tp, {
		width: 9 * col48 - 2 * tp,
		align: "right"
	});

	doc.lineJoin('miter').rect(50, top + altura * indice, 21 * col48, altura).stroke();
	doc.lineJoin('miter').rect(50 + 21 * col48, top + altura * indice, 9 * col48, altura).stroke();
	doc.lineJoin('miter').rect(50 + 30 * col48, top + altura * indice, 9 * col48, altura).stroke();
	doc.lineJoin('miter').rect(50 + 39 * col48, top + altura * indice, 9 * col48, altura).stroke();

	return doc;
}

Meteor.methods({
	AgregarCategoria: function (doc) {
		return Categorias.insert(doc);
	},
	CrearEmpresa: function (doc) {
		return Empresas.insert(doc);
	},
	EliminarUsuario(userId) {
		console.log(userId);
		var eliminador = Meteor.user();
		var usuario = Meteor.users.findOne(userId);
		console.log(usuario);
		if (usuario.profile.role == 6) {
			Meteor.users.update(userId, {
				$set: {
					"profile.role": 7
				}
			});
		} else if (usuario.profile.role == 7 || eliminador.profile.role == 1) {
			Meteor.users.remove(userId);
		}
	},
	ActualizarPassword: function (userId, password) {
		//console.log("Actualizando password", userId, password);
		Accounts.setPassword(userId, password);
	},
	ActualizarUsuario: function (userId, docSet, docUnset) {
		console.log("ACTUALIZANDO USUARIO-->", userId, docSet, docUnset);
		var error = false;
		var doc = {};
		if (!userId) {
			var password = docSet.profile.password;
			var email = docSet.email;
			delete docSet.profile.password;
			delete docSet.profile.repassword;
			delete docSet.email;
			if (docSet.profile.role == 6) {
				docSet.profile.appz = "panelTrabajador";
			}
			//console.log("Creando cuenta", { email: doc.$set.email, password: password, profile: doc.$set.profile });
			userId = Accounts.createUser({
				email: email,
				password: password,
				profile: docSet.profile
			});
		} else {
			if (docSet.password) {
				Meteor.updatePassword(userId, password);
				return userId;
			}
			var doc = {};
			if (!_.isEmpty(docSet)) {
				doc.$set = docSet;
			}
			if (!_.isEmpty(docUnset)) {
				doc.$unset = docUnset;
			}
			console.log("DOC", doc);
			Meteor.users.update({
				_id: userId
			}, doc);
		}
		return userId;
	},
	ActualizarPerfil(doc) {
		Meteor.users.update({
			_id: Meteor.user()._id
		}, {
			$set: doc
		});
	},
	ActualizarCotizacion(id, doc) {
		if (id) {
			Cotizaciones.update(id, doc);
			if (!_.isEmpty(doc.$set) && !isNaN(doc.$set.valorHH)) {
				console.log("Hay cambio en el valor HH");
				var cotizacion = Cotizaciones.find(id);
				var total = 0,
					moneda = false;
				Items.find({
					cotizacionId: id
				}).forEach(function (i) {
					if (!_.isEmpty(i.moneda) && i.moneda.includes("HH")) {
						total = total + i.cantidad;
					} else {
						total = total + i.cantidad * i.valor;
					}
					if (!moneda) moneda = i.moneda;
					console.log("item", id, i.moneda);
					var valorHH = doc.$set.valorHH;
					if (!_.isEmpty(i.moneda) && i.moneda.includes("HH")) {
						Items.update(i._id, {
							$set: {
								total: valorHH * i.cantidad
							}
						});
						console.log("cambio", i._id, valorHH, i.cantidad);
					}
				});
				console.log("total", total);
				Cotizaciones.update(cotizacion._id, {
					$set: {
						total: total,
						moneda: moneda
					}
				});
			}
			return id;
		}
		return Cotizaciones.insert(doc);
	},
	SendEmail: function (to, from, subject, htmlText) {
		this.unblock();
		Email.send({
			to: to,
			from: from,
			subject: subject,
			html: htmlText
		});
	},
	CrearProyecto: function (doc) {
		var pId = Proyectos.insert(doc);
		return pId;
	},
	ActualizarItem: function (itemId, doc) {
		if (itemId) {
			Items.update(itemId, doc);
			var cotId = Items.findOne(itemId).cotizacionId;
			if (doc.$set.valor || doc.$set.cantidad) {
				var total = 0,
					moneda = false;
				Items.find({
					cotizacionId: cotId
				}).forEach(function (i) {
					if (!_.isEmpty(i.moneda) && i.moneda.includes("HH")) {
						total = total + i.cantidad;
					} else {
						total = total + i.cantidad * i.valor;
					}
					if (!moneda) moneda = i.moneda;
				});
				Cotizaciones.update(cotId, {
					$set: {
						total: total,
						moneda: moneda
					}
				});
				/*total = 0;
				var pId = Cotizaciones.findOne(cotId).proyectoId;
				Cotizaciones.find({
				  proyectoId: pId
				}).forEach(function (p) {
				  total = total + p.total;
				});*/
			}
		} else {
			return Items.insert(doc);
		}
		return itemId;
	},
	EliminarEmpresa: function (eId) {
		if (Empresas.findOne(eId).creadorId != this.userId) {
			return "ERROR - VIOLACION DE ACCEDO";
		} else {
			Empresas.remove(eId);
			Equipos.remove({
				empresaId: eId
			});
		}
	},
	CargarCategorias: function () {
		var estados_cotizacion = [
			{
				llave: "EST_COT",
				codigo: 1,
				glosa: "Borrador",
				descripcion: "Cotización en revisión"
            },
			{
				llave: "EST_COT",
				codigo: 2,
				glosa: "Enviada",
				descripcion: "Cotización enviada cliente"
            },
			{
				llave: "EST_COT",
				codigo: 3,
				glosa: "Aceptada",
				descripcion: "Cotización aceptada por cliente"
            },
			{
				llave: "EST_COT",
				codigo: 4,
				glosa: "Rechazada",
				descripcion: "Cotización rechazada por cliente"
            },
			{
				llave: "EST_COT",
				codigo: 5,
				glosa: "Impaga",
				descripcion: "Cotización en revisión"
            },
			{
				llave: "EST_COT",
				codigo: 6,
				glosa: "Pago parcial",
				descripcion: "Cotización en revisión"
            },
			{
				llave: "EST_COT",
				codigo: 7,
				glosa: "Pagada",
				descripcion: "Cotización en revisión"
            }
    ];
		var estados_factura = [
			{
				llave: "EST_FAC",
				codigo: 1,
				glosa: "Pendiente Facturación",
				descripcion: "Cotización ha sido facturada"
            },
			{
				llave: "EST_FAC",
				codigo: 2,
				glosa: "Facturada",
				descripcion: "Cotización ha sido facturada"
            },
			{
				llave: "EST_FAC",
				codigo: 3,
				glosa: "Factura Imaga",
				descripcion: "Factura no registra pago alguno"
            },
			{
				llave: "EST_FAC",
				codigo: 4,
				glosa: "Factura Parcialmente pagada",
				descripcion: "Factura registra parte del total de pagos"
            },
			{
				llave: "EST_FAC",
				codigo: 5,
				glosa: "Factura Pagada",
				descripcion: "Factura pagada"
            }
    ];

		estados_cotizacion.forEach(function (o) {
			Categorias.insert(o);
		})

		estados_factura.forEach(function (o) {
			Categorias.insert(o);
		});

		console.log("Agregador");
	},

	ProcesarAsistencia: function (bioId, cadena) {
		var user = Meteor.users.findOne({
			"profile.bioId": bioId
		});
		if (!user) {
			return {
				item: "No existe user BioID " + bioId
			};
		}
		var fecha = moment(cadena, "DD-MM-YYYY H:mm:ss");
		if (!fecha) {
			return {
				item: "Irreconocible " + cadena
			};
		}
		var msmarcacion = fecha.hours() * 60 * 60 * 3600 + fecha.minutes() * 60 * 3600;
		var reg = Asistencias.findOne({
			userId: user._id,
			day: fecha.date(),
			month: fecha.month(),
			year: fecha.year()
		});

		if (!reg) {
			var id = Asistencias.insert({
				userId: user._id,
				day: fecha.date(),
				month: fecha.month(),
				year: fecha.year(),
				marcas: [{
					ms: msmarcacion
        }]
			});
			reg = Asistencias.findOne(id);
		} else {
			// En este caso es necesario agregar la marcacion si no existe
			var existe = false;
			for (var i = 0; i < reg.marcas.length; i++) {
				if (msmarcacion == reg.marcas[i].ms) {
					existe = true;
				}
			}
			if (!existe) {
				reg.marcas.push({
					ms: msmarcacion
				});
				reg.marcas = reg.marcas.sort(function (x, y) {
					return x.ms - y.ms;
				});
				Asistencias.update({
					_id: reg._id
				}, {
					$set: {
						marcas: reg.marcas
					}
				});
			}
		}
		ProcessAssistanceHH(reg._id);
		return false;
	},
	ProcesarCambioAsistencia: function (id, doc) {
		console.log(id, doc);
		if (!id) {
			id = Asistencias.insert(doc.$set);
			//console.log("Creado: " + id);
		} else {
			Asistencias.update({
				_id: id
			}, doc);
		}
		ProcessAssistanceHH(id);
	},
	LlenarAsistencia(doc) {
		var a = Asistencias.findOne(doc);
		var marcas = [{
			"ms": 110160000
    }, {
			"ms": 168480000
    }, {
			"ms": 181440000
    }, {
			"ms": 239760000
    }];
		if (!a) {
			console.log("INSERT");
			doc.marcas = marcas;
			a = {};
			a._id = Asistencias.insert(doc);
		} else {
			console.log("UPDATE");
			Asistencias.update({
				_id: a._id
			}, {
				$set: {
					marcas: marcas
				}
			});
		}
		ProcessAssistanceHH(a._id);
	},
	ActualizarLibro: function (id, doc) {
		//console.log("doc" + JSON.stringify(doc))
		Meteor.users.update({
			_id: id
		}, doc)
	},

	PoblarAsistencias: function () {
		Asistencias.find().forEach(function (a) {
			ProcessAssistanceHH(a._id);
		});
	},
	EnviarCotizacionPorEmail: function (id) {
		var cot = Cotizaciones.findOne(id);
		console.log("Enviando cotizacion", id);
		var cliente = Meteor.users.findOne(cot.clienteId);
		if (!cliente) return "Error - No tiene cliente asociado";
		this.unblock();
		Email.send({
			to: 'ega.informaciones@gmail.com',
			from: 'edtronco@gmail.com',
			subject: 'Cotización Oferta N°' + cot.numero + ': ' + cot.titulo,
			text: '<body><span>Tenemos el agrado de hacerle llegar a usted</span></body>',
			//attachments: new MailgunInstance.api.Attachment({ data: FabricaPDFs("simen", "cotizacion", { cotizacionId: cot._id }), filename: "cualquier_cosa.pdf" })
		});
	},
	ObtenerPDF: function (identificador, tipo, parametros) {
		return FabricaPDFs(identificador, tipo, parametros);
	},

	ProcesarCambioHora(dia, mes, ano) {
		var ids = Asistencias.find({
			day: {
				$gte: dia
			},
			month: mes,
			year: ano
		}).map(function (a) {
			return a._id
		});

		ids.forEach(function (id) {
			let asistencia = Asistencias.findOne({
				_id: id
			});
			let marcas = asistencia.marcas;
			if (marcas) {
				var nuevas = [];
				marcas.forEach(function (marca) {
					var nueva = {
						ms: marca.ms + 3600000 + 12960000
					};
					if (marca.nota) {
						nueva.nota = marca.nota;
					}
					nuevas.push(nueva);
				});
				Asistencias.update({
					_id: id
				}, {
					$set: {
						marcas: nuevas
					},
					$unset: {
						ms: "",
						nota: ""
					}
				});
				ProcessAssistanceHH(id);
			}
		});

		console.log("CORREGIDO...");
	}
});