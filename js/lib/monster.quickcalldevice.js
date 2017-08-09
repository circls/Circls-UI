define(function(require){
        var $ = require("jquery"),
                _ = require("underscore"),
                monster = require("monster");

	var quickcalldevice = {

		populateDropdown: function(dropdown, _selected) {
			var self = this
                        ,selected = _selected;
			if(typeof monster.apps.auth.currentUser.devices == 'undefined')
				quickcalldevice.getlist();
			if(typeof monster.apps.auth.currentUser.devices == 'object')
			$.each(monster.apps.auth.currentUser.devices , function(i, data) {
				if(selected == data.id) {
					dropdown.append('<option value="' + data.id + '" SELECTED>' + data.name + '</option>');
				}
				else {
					dropdown.append('<option value="' + data.id + '">' + data.name + '</option>');
				}
			});
		},

		getlist: function() {
			var self = this;
			self.usersGetDevicesData(function(devicesData) {
				var devices = {};
				_.each(devicesData, function(device) {
					if( (!('owner_id' in device) || device.owner_id === '' || device.enabled === 'false' || device.owner_id === monster.apps.auth.currentUser.id) ) {
						devices[device.id] = device;
					}
				});
				monster.apps.auth.currentUser.devices = devices;
			});
		},

                usersGetDevicesData: function(callback) {
                        var self = this;
                        monster.apps.auth.callApi({
                                resource: 'device.list',
                                data: {
                                        accountId: monster.apps.auth.currentAccount.id,
                                        filters: {
                                                paginate: 'false'
                                        }
                                },
                                success: function(_data) {
                                        callback && callback(_data.data)
                                }
                        });
                }

	};
	if(typeof monster.apps.auth.currentUser.devices == 'undefined')
		quickcalldevice.getlist();
	return quickcalldevice;
});