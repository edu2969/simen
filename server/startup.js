Meteor.startup(function () {
	if (Meteor.isServer && Meteor.users.find().count() == 0) {
		Accounts.createUser({
			username: "neo",
			password: "Metal!",
			email: "neo@simen.cl"
		});
	}
	// test gmail. Se debe deshabilitar el envio desde aplicaciones no seguras en GMail.security
	process.env.MAIL_URL = "smtp://edtronco%40gmail.com:;Eatm105.@smtp.gmail.com:465/";
});