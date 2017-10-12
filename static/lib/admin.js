'use strict';
/* globals $, app, socket */

define('admin/plugins/groupcategories', ['settings'], function(Settings) {

	var ACP = {};

	ACP.init = function() {
		Settings.load('groupcategories', $('.groupcategories-settings'));

		$('#save').on('click', function() {
			Settings.save('groupcategories', $('.groupcategories-settings'), function() {
				app.alert({
					type: 'success',
					alert_id: 'groupcategories-saved',
					title: 'Settings Saved',
					message: 'Please reload your NodeBB to apply these settings',
					clickfn: function() {
						socket.emit('admin.reload');
					}
				});
			});
		});
	};

	return ACP;
});
