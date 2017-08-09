define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		mask = require('mask'),
		monster = require('monster'),
		toastr = require('toastr');

	var app = {

		requests: {
			'provisioner.ui.getModel': {
				'apiRoot': monster.config.api.provisioner,
				'url': 'ui/{brand}/{family}/{model}',
				'verb': 'GET',
                                'headers': {
                                        'Accept': '*/*'
                                },
				generateError: false
			}
		},

		subscribe: {
			'voip.devices.render': 'devicesRender',
			'voip.devices.renderAdd': 'devicesRenderAdd',
			'voip.devices.renderChange': 'modelsRenderChange',
			'voip.devices.editDevice': 'devicesRenderEdit'
		},

		/* Users */
		/* args: parent and deviceId */
		devicesRender: function(pArgs) {
			var self = this,
				args = pArgs || {},
				parent = args.parent || $('.right-content'),
				_deviceId = args.deviceId || '',
				callback = args.callback;

			self.devicesGetData(function(data) {
				var dataTemplate = self.devicesFormatListData(data),
					template = $(monster.template(self, 'devices-layout', dataTemplate)),
					templateDevice;
				_.each(dataTemplate.devices, function(device) {
					templateDevice = monster.template(self, 'devices-row', device);

					template.find('.devices-rows').append(templateDevice);
				});

				self.devicesBindEvents(template, parent, dataTemplate);

				parent
					.empty()
					.append(template);

				if(_deviceId) {
					var row = parent.find('.grid-row[data-id=' + _deviceId + ']');

					monster.ui.highlight(row, {
						endColor: '#FCFCFC'
					});
				}

				if ( dataTemplate.devices.length === 0 ) {
					parent.find('.no-devices-row').css('display', 'block');
				} else {
					parent.find('.no-devices-row').css('display', 'none');
				}

				callback && callback();
			});
		},

		devicesBindEvents: function(template, parent, data) {
			var self = this;

			setTimeout(function() { template.find('.search-query').focus(); });

			template.find('.devices-header .search-query').on('keyup', function() {
				var searchString = $(this).val().toLowerCase(),
					rows = template.find('.devices-rows .grid-row:not(.title)'),
					emptySearch = template.find('.devices-rows .empty-search-row');

				_.each(rows, function(pRow) {
					var row = $(pRow);

					row.data('search').toLowerCase().indexOf(searchString) < 0 ? row.hide() : row.show();
				});

				if(rows.size() > 0) {
					rows.is(':visible') ? emptySearch.hide() : emptySearch.show();
				}
			});

			template.find('.switch-state').on('change', function() {
				var toggle = $(this),
					row = toggle.parents('.grid-row'),
					deviceId = row.data('id'),
					enable = toggle.prop('checked');

				self.devicesGetDevice(deviceId, function(dataDevice) {
					dataDevice.enabled = enable;

					self.devicesUpdateDevice(dataDevice, function(dataDevice) {
						row.find('.type').removeClass('unregistered registered disabled');

						var classStatus = 'disabled';

						if(dataDevice.enabled === true) {
							classStatus = 'unregistered';

							_.each(data.devices, function(device) {
								if(device.id === dataDevice.id) {
									if(device.registered === true) {
										classStatus = 'registered';
									}

									return false;
								}
							});
						}

						row.find('.type').addClass(classStatus);
						//We could display a success message but that could spam the user so for now we don't display anything
					},
					function() {
						toggle.prop('checked', !enable);
					});
				},
				function() {
					toggle.prop('checked', !enable);
				});
			});

			template.find('.settings').on('click', function() {
				var $this = $(this),
					dataDevice = {
						id: $this.parents('.grid-row').data('id'),
						isRegistered: $this.parents('.grid-row').data('registered') === true
					};

				self.devicesRenderEdit({ data: dataDevice, callbackSave: function(dataDevice) {
					self.devicesRender({ deviceId: dataDevice.id });
				}});
			});

			template.find('.create-device').on('click', function() {
				var type = $(this).data('type');

				self.devicesRenderAdd({
					type: type,
					callback: function(device) {
						self.devicesRender({ deviceId: device.id });
					}
				});
			});

                        template.find('#buy_devices').on('click', function(e) {
                                e.preventDefault();

                                monster.pub('common.buyDevices', {
                                        searchType: $(this).data('type'),
                                        callbacks: {
                                                success: function(pbxs) {
                                                        self.getAccount(function(globalData) {
                                                                _.each(pbxs, function(val, key) {
                                                                        globalData.data.servers[serverId].DIDs[key] = {
                                                                                failover: false,
                                                                                cnam: false,
                                                                                dash_e911: false
                                                                        };
                                                                });
                                                                self.updateOldTrunkstore(globalData.data, function(updatedData) {
                                                                        self.renderList(serverId, undefined, undefined, updatedData.data.servers);
//                                                                      self.listPbxsByPbx(serverId, callback_listing);
                                                                });
                                                        });
                                                }
                                        }
                                });
                        });

		},

		devicesDropdown: function(dropdown, _selected) {
			self = this;
			self.devicesGetData(function(data) {
			selected = _selected;
				$.each(data.devices, function(i, dev) {
					if(dev.device_type == 'sip_device')
					if(selected == dev.id) {
						dropdown.append('<option value="' + dev.id + '" SELECTED>' + dev.name + '</option>');
					} else {
						dropdown.append('<option value="' + dev.id + '">' + dev.name + '</option>');
					}
				});
			});
		},

		devicesRenderEdit: function(args) {
			var self = this,
				data = args.data,
				usenotprov = args.flags,
				useprov = args.prov,
				usetemplate = args.template,
				callbackSave = args.callbackSave,
				callbackDelete = args.callbackDelete || function(device) {
					self.devicesRender();
				};

			if(typeof args.data == "undefined") var data = {id: args.args};

                        self.devicesGetEditData(data, function(dataDevice) {
				if(typeof usenotprov !== "undefined") {
					delete dataDevice.provision;
				}
				if(typeof useprov !== "undefined") {
					dataDevice.provision = data.provision,
					dataDevice.name = data.name,
					dataDevice.mac_address = data.mac_address;
				}
				if(typeof usetemplate !== "undefined" && (args.data.type == 'sip_device' || dataDevice.device_type == 'sip_device')) {
					dataDevice.provision = data.provision,
					dataDevice.provision.feature_keys = data.provision.feature_keys,
					dataDevice.suppress_unregister_notifications = data.suppress_unregister_notifications,
					dataDevice.register_overwrite_notify = data.register_overwrite_notify;
				}
				if(typeof usetemplate !== "undefined") {
					dataDevice.media = data.media,
					dataDevice.call_restriction = data.call_restriction;
				}

                                if (dataDevice.hasOwnProperty('provision') && (args.data.type == 'sip_device' || dataDevice.device_type == 'sip_device')) {
                                        if (typeof dataDevice.provision.endpoint_brand !== "string" || typeof monster.apps.auth.currentAccount !== "object" || typeof monster.apps.auth.currentAccount.provision !== "object") {
                                            toastr.error(self.i18n.active().devices.popupSettings.sip.provstring_conferror, '', {"timeOut": 10000});
                                        } else {
                                            if(typeof monster.config.api.provisioner !== "string" || typeof monster.config.api.provisioner_http !== "string" || typeof monster.apps.auth.currentAccount.provision.urlpass !== "string") {
                                                toastr.error(self.i18n.active().devices.popupSettings.sip.provstring_jsconferror, '', {"timeOut": 10000});
                                            } else {
                                                if (typeof dataDevice.mac_address == "string" && typeof monster.apps.auth.currentAccount.provision == "object") {
                                                    if(monster.apps.auth.currentAccount.provision.provision_enabled == false || monster.apps.auth.currentAccount.provision.urlpass == "") {
                                                        toastr.error(self.i18n.active().devices.popupSettings.sip.provstring_conferror, '', {"timeOut": 10000});
                                                    }
                                                    if(dataDevice.provision.endpoint_brand == "snom") dataDevice.provision.provstring = monster.config.api.provisioner_http + 'prov/' + dataDevice.provision.endpoint_brand + "/" + "settings.php?mac={mac}&pass=" + monster.apps.auth.currentAccount.provision.urlpass;
                                                    if(dataDevice.provision.endpoint_brand == "snom" && dataDevice.provision.endpoint_model == 'm3') dataDevice.provision.provstring = monster.config.api.provisioner_http + 'prov/' + dataDevice.provision.endpoint_brand + "/";
                                                    if(dataDevice.provision.endpoint_brand == "mitel") dataDevice.provision.provstring = monster.config.api.provisioner + 'prov/' + dataDevice.provision.endpoint_brand + "/";
                                                    if(dataDevice.provision.endpoint_brand == "yealink") dataDevice.provision.provstring = monster.config.api.provisioner_http + 'prov/' + dataDevice.provision.endpoint_brand + "/" + dataDevice.mac_address.replace(/\:/g, "").toLowerCase() + ".cfg?pass=" + monster.apps.auth.currentAccount.provision.urlpass;

                                                    // not branded or invite us for support
                                                    if(dataDevice.provision.endpoint_brand !== "snom" && dataDevice.provision.endpoint_brand !== "yealink" && dataDevice.provision.endpoint_brand !== "mitel")
                                                        dataDevice.provision.provstring = self.i18n.active().devices.popupSettings.sip.provstring_notsupported||'';
                                                }
					    }
					}
					self.devicesGetIterator(dataDevice.provision, function(template) {
                                                for (var k = parseInt(template.feature_keys.iterate)+1; k <= 200; k++) {
                                                    if (dataDevice.provision.hasOwnProperty('feature_keys'))
                                                        if (typeof dataDevice.provision.feature_keys[k] == "object")
                                                            delete dataDevice.provision.feature_keys[k];
                                                }
						if (template.hasOwnProperty('feature_keys') && template.feature_keys.iterate > 0) {
							if (!dataDevice.provision.hasOwnProperty('feature_keys')) {
								dataDevice.provision.feature_keys = {};
							}

							for (var i = 0, len = template.feature_keys.iterate; i <= len; i++) {
								if (!dataDevice.provision.feature_keys.hasOwnProperty(i)) {
									dataDevice.provision.feature_keys[i] = { type: 'none' };
								}
							}

							self.callApi({
								resource: 'user.list',
								data: {
									accountId: self.accountId
								},
								success: function(data, status) {
									var keyTypes = [ 'none', 'presence', 'parking', 'personal_parking', 'speed_dial' ],
										parkingSpots = [],
										pextra;

									data.data.sort(function(a, b) {
										return a.last_name.toLowerCase() > b.last_name.toLowerCase() ? 1 : -1;
									});

									for (var i = 0; i < 10; i++) {
										parkingSpots[i] = i + 1;
									}

									keyTypes.forEach(function(val, idx, arr) {
										arr[idx] = { id: val, text: self.i18n.active().devices.popupSettings.featureKeys.types[val] };

										if (val !== 'none') {
											arr[idx].info = self.i18n.active().devices.popupSettings.featureKeys.info.types[val];
										}
									});

									pextra = {
										users: data.data,
										featureKeys:{
											parkingSpots: parkingSpots,
											types: keyTypes
										}
									};

									dataDevice.extra.provision = dataDevice.hasOwnProperty(pextra) ? $.extend(true, {}, dataDevice.extra, pextra) : pextra;

									self.devicesRenderDevice(dataDevice, callbackSave, callbackDelete);

									// correct fkey settings about key0
									$('[data-id="0"]').hide();

								}
							});
						}
						else {
							self.devicesRenderDevice(dataDevice, callbackSave, callbackDelete);
						}
					}, function() {
						self.devicesRenderDevice(dataDevice, callbackSave, callbackDelete);
					});
				}
				else {
					delete dataDevice.mac_address,
					self.devicesRenderDevice(dataDevice, callbackSave, callbackDelete);
				}
			});
		},

		devicesRenderAdd: function(args) {
			var self = this,
				type = args.type,
				callback = args.callback,
				data = {
					device_type: type
				};

			if(type === 'sip_device' && monster.config.api.provisioner) {
				monster.pub('common.chooseModel.render', {
					callback: function(dataModel, callbackCommonSuccess) {
                                            self.devicesGetIterator(dataModel.provision, function(template) {
                                                if (template.hasOwnProperty('feature_keys') && template.feature_keys.iterate > 0) {
                                                        var feature_keys = {};
                                                        for (var i = 0, len = template.feature_keys.iterate; i <= len; i++) {
                                                                feature_keys[i] = { type: 'none' };
                                                        }
                                                        delete dataModel.provision.interite;
                                                        dataModel.provision.feature_keys = feature_keys;
                                                }
                                            });
                                            if(typeof monster.apps.auth.currentAccount.provision == "object") {
                                            if(typeof monster.apps.auth.currentAccount.provision.keytemplate !== 'undefined') {
                                                self.templateRenderChange({
                                                        data: dataModel,
                                                        deviceId: monster.apps.auth.currentAccount.provision.keytemplate,
                                                        renderedit: 'false',
                                                        callback: function(templateModel) {
                                                                dataModel.provision = templateModel.provision;
                                                                dataModel.suppress_unregister_notifications = templateModel.suppress_unregister_notifications,
                                                                dataModel.register_overwrite_notify = templateModel.register_overwrite_notify,
                                                                dataModel.media = templateModel.media,
                                                                dataModel.call_restriction = templateModel.call_restriction;
                                                        }
						});
					    }}
					    self.devicesRenderEdit({ 
							data: dataModel,
							prov: true,
							callbackSave: function(dataDevice) {
								callback && callback(dataDevice);
							}
					    });
					},
					callbackMissingBrand: function() {
						self.devicesRenderEdit({ data: data, callbackSave: function(dataDevice) {
							callback && callback(dataDevice);
						}});
					}
				});
			} else if((type == 'softphone' || type == 'smartphone') && monster.config.api.provisioner) {
                                if(typeof monster.apps.auth.currentAccount.provision == "object") {
                                if(typeof monster.apps.auth.currentAccount.provision.keytemplate !== 'undefined') {
				    data.type = type;
                                    self.templateRenderChange({
                                            data: data,
                                            deviceId: monster.apps.auth.currentAccount.provision.keytemplate,
                                            renderedit: 'true',
                                            callback: function(templateModel) {
                                                    data.call_restriction = templateModel.call_restriction;
                                            }
				    });
				    data.template = true;
				    self.devicesRenderEdit({ 
					data: data,
					prov: false,
					callbackSave: function(dataDevice) {
						callback && callback(dataDevice);
					}
				    });
				} else
					self.devicesRenderEdit({ data: data, callbackSave: function(dataDevice) {
						callback && callback(dataDevice);
					}});
				} else
					self.devicesRenderEdit({ data: data, callbackSave: function(dataDevice) {
						callback && callback(dataDevice);
					}});
			} else {
				self.devicesRenderEdit({ data: data, callbackSave: function(dataDevice) {
					callback && callback(dataDevice);
				}});
			}
		},

		modelsRenderChange: function(args) {
			var self = this;
			if(typeof args.data === "object" && typeof args.callback === "function") {
				data = args.data,
				callback = args.callback
			}

			if(data.device_type === 'sip_device' && monster.config.api.provisioner) {
				monster.pub('common.chooseModel.render', {
					deviceData: data,
					callback: function(dataModel, callbackCommonSuccess) {
						if(typeof data.provision == "undefined")
							data.provision = {};
						prov = 'true',
						data.provision.endpoint_brand = dataModel.provision.endpoint_brand,
						data.provision.endpoint_family = dataModel.provision.endpoint_family,
						data.provision.endpoint_model = dataModel.provision.endpoint_model,
						data.name = dataModel.name,
						data.mac_address = dataModel.mac_address,
						self.devicesRenderEdit({ data: data, prov});
//						self.devicesRender();
					},
					callbackMissingBrand: function() {
						flags = 'true',
						self.devicesRenderEdit({ data: data, flags });
//						self.devicesRender();
					}
				});
			}
			else {
				self.devicesRenderEdit({ data: data, callbackSave: function(dataDevice) {
					callback && callback(dataDevice);
				}});
			}
		},

		templateRenderChange: function(args) {
			var self = this;
			callback = args.callback;

			if((args.data.device_type === 'sip_device' || args.data.device_type == 'softphone'
						|| args.data.device_type == 'smartphone') && monster.config.api.provisioner) {
				self.devicesGetDevice(args.deviceId, function(dataDevice) {
					template = 'true';
					if(typeof dataDevice.provision !== "undefined") {
						if(typeof dataDevice.provision.feature_keys == "object" && args.data.device_type === 'sip_device') {
							// cleanup to many keys
							$.each(dataDevice.provision.feature_keys, function(i, fkey) {
								if(i > _.size(args.data.provision.feature_keys)) {
									delete dataDevice.provision.feature_keys[i];
								}
							});
							args.data.provision.feature_keys = dataDevice.provision.feature_keys;
						} else if(typeof dataDevice.provision.feature_keys != "object" && args.data.device_type === 'sip_device')
							args.data.provision.feature_keys = {};
						if(args.renderedit !== 'true' && args.data.device_type === 'sip_device') {
							args.data.suppress_unregister_notifications = dataDevice.suppress_unregister_notifications,
							args.data.register_overwrite_notify = dataDevice.register_overwrite_notify,
							args.data.media = dataDevice.media;
						}
						if(args.data.device_type === 'sip_device' || args.data.device_type == 'softphone'|| args.data.device_type == 'smartphone') {
							args.data.call_restriction = dataDevice.call_restriction;
						}
					}
					if(typeof callback !== 'function') {
						self.devicesRenderEdit({ data: args.data, template});
					} else {
						callback(args.data);
//						self.devicesRender();
					}
				});
			} else {
				self.devicesRenderEdit({ data: data, callbackSave: function(dataDevice) {
					callback && callback(dataDevice);
				}});
			}
		},

		devicesRenderDevice: function(data, callbackSave, callbackDelete) {
			var self = this,
				mode = data.id ? 'edit' : 'add',
				type = data.device_type,
				popupTitle = mode === 'edit' ? monster.template(self, '!' + self.i18n.active().devices[type].editTitle, { name: data.name }) : self.i18n.active().devices[type].addTitle;
                                data.account = monster.apps.auth.currentAccount;
				templateDevice = $(monster.template(self, 'devices-'+type, data));
				deviceForm = templateDevice.find('#form_device');

			if (typeof data.provision == 'object')
			if (data.hasOwnProperty('provision') && data.provision.hasOwnProperty('feature_keys')) {
				var section = '.tabs-section[data-section="featureKeys"] ';

				_.each(data.provision.feature_keys, function(val, key){
					var group = '.control-group[data-id="' + key + '"] ',
						value = '.feature-key-value[data-type="' + val.type + '"]';

					templateDevice
						.find(section.concat(group, value))
							.addClass('active')
						.find('[name="provision.feature_keys[' + key + '].value"]')
							.val(val.value);
				});

				$.each(templateDevice.find('.feature-key-index'), function(idx, val) {
					$(val).text(parseInt($(val).text(), 10) + 0);
				});
			}

			if ( data.extra.hasE911Numbers ) {
				var currentNumber;

				if(data.caller_id && data.caller_id.emergency && data.caller_id.emergency.number) {
					currentNumber = data.caller_id.emergency.number;
					self.devicesGetE911NumberAddress(data.caller_id.emergency.number, function(address) {
						templateDevice
									.find('.number-address')
									.show()
									.find('p')
									.html(address);
					});
				}

				monster.pub('common.numberSelector.render', {
					container: templateDevice.find('.emergency-number'),
					inputName: 'caller_id.emergency.number',
					number: currentNumber,
					customNumbers: data.extra.e911Numbers,
					noBuy: true,
					labels: {
						empty: self.i18n.active().devices.popupSettings.callerId.notSet,
						remove: self.i18n.active().devices.popupSettings.callerId.useDefault,
						spare: self.i18n.active().devices.popupSettings.callerId.selectNumber,
						hideNumber: true
					}
				});
			}

			monster.ui.validate(deviceForm, {
				rules: {
					'name': {
						required: true
					},
					'mac_address': {
						required: true,
						mac: true
					},
					'mobile.mdn': {
						number: true
					},
					'sip.username': {
						required: true
					},
					'sip.password': {
						required: true
					},
					'call_forward.number': {
						required: true
					}
				},
				ignore: '' // Do not ignore hidden fields
			});

			if($.inArray(type, ['sip_device', 'smartphone', 'mobile', 'softphone', 'fax', 'ata']) > -1) {
				var audioCodecs = monster.ui.codecSelector('audio', templateDevice.find('#audio_codec_selector'), data.media.audio.codecs);
			}

			if($.inArray(type, ['sip_device', 'smartphone', 'mobile', 'softphone']) > -1) {
				var videoCodecs = monster.ui.codecSelector('video', templateDevice.find('#video_codec_selector'), data.media.video.codecs);
			}

                        if  (typeof data.media.audio['tx_volume'] !== 'number') data.media.audio['tx_volume'] = '0';
                        var slider_tx  = templateDevice.find('#slider_tx'),tooltip_tx = templateDevice.find('.tooltip_tx');
                                        tooltip_tx.css('left', data.media.audio['tx_volume']).text( data.media.audio['tx_volume']);
                                        slider_tx.slider({
                                        range: "min",min: -8,value: data.media.audio['tx_volume'],max: 8,step: 1,
                                        slide: function(event, ui_tx) { //When the slider is sliding
                                                var value_tx  = slider_tx.slider('value'),
                                                volume_tx = templateDevice.find('.volume_tx');
                                                tooltip_tx.css('left', value_tx).text(ui_tx.value);  //Adjust the tooltip accordingly
                                                if(value_tx < -3) {volume_tx.css('background-position', '0 0');}
                                                else if (value_tx <= -1) {volume_tx.css('background-position', '0 -25px');}
                                                else if (value_tx <= 2) {volume_tx.css('background-position', '0 -50px');}
                                                else {volume_tx.css('background-position', '0 -75px');};
                                        }
                        });
                        if(typeof data.media.audio['rx_volume'] !== 'number') data.media.audio['rx_volume'] = '0';
                        var volume_tx = $('#slider_tx').slider("option", "value_tx");
                        var volume_rx = $('#slider_rx').slider("option", "value_rx");
                        var slider_rx  = templateDevice.find('#slider_rx'), tooltip_rx = templateDevice.find('.tooltip_rx');
                                        tooltip_rx.css('left', data.media.audio['rx_volume']).text( data.media.audio['rx_volume']);
                                        slider_rx.slider({
                                        range: "min",min: -8,value: data.media.audio['rx_volume'],max: 8,step: 1,
                                        slide: function(event, ui_rx) { //When the slider is sliding
                                                var value_rx  = slider_rx.slider('value'),
                                                volume_rx = templateDevice.find('.volume_rx');
                                                tooltip_rx.css('left', value_rx).text(ui_rx.value);  //Adjust the tooltip accordingly
                                                if(value_rx < -3) {volume_rx.css('background-position', '0 0');}
                                                else if (value_rx <= -1) {volume_rx.css('background-position', '0 -25px');}
                                                else if (value_rx <= 2) {volume_rx.css('background-position', '0 -50px');}
                                                else {volume_rx.css('background-position', '0 -75px');};
                                        },
                        });


			monster.ui.tabs(templateDevice);
			monster.ui.protectField(templateDevice.find('#sip_password'), templateDevice);

			monster.ui.tooltips(templateDevice);
			monster.ui.mask(templateDevice.find('#mac_address'), 'macAddress');
			templateDevice.find('.chosen-feature-key-user').chosen({ search_contains: true, width: 'inherit' });

			if(!(data.media.encryption.enforce_security)) {
				templateDevice.find('#rtp_method').hide();
			}

			templateDevice.find('#secure_rtp').on('change', function() {
				templateDevice.find('#rtp_method').toggle();
			});

			templateDevice.find('#restart_device').on('click', function() {
				if(!$(this).hasClass('disabled')) {
					self.devicesRestart(data.id, function() {
						toastr.success(self.i18n.active().devices.popupSettings.miscellaneous.restart.success);
					});
				}
			});

			templateDevice.find('.change-model').on('click', function() {
				if(data.device_type == 'sip_device') {
					popup.dialog('close').remove();
					self.modelsRenderChange({
						data: data,
						callback: function(device) {
							self.modelsRenderChange({ deviceId: data.id });
						}
					});
				}
			});

			templateDevice.find('.change-keyfeatures').on('click', function() {
					Id = $("#device_keytemplate").val(),
					popup.dialog('close').remove();
					self.templateRenderChange({
						deviceId: Id,
						data: data,
						renderedit: true
					});
			});

			templateDevice.find('.actions .save').on('click', function() {
				if(monster.ui.valid(deviceForm)) {
					templateDevice.find('.feature-key-value:not(.active)').remove();

					var dataToSave = self.devicesMergeData(data, templateDevice, audioCodecs, videoCodecs, slider_tx.slider('value'), slider_rx.slider('value')), suppress_unregister_notifications;
					self.devicesSaveDevice(dataToSave, function(data) {
						popup.dialog('close').remove();

						callbackSave && callbackSave(data);
					});
				} else {
					templateDevice.find('.tabs-selector[data-section="basic"]').click();
				}
			});

			templateDevice.find('#delete_device').on('click', function() {
				var deviceId = $(this).parents('.edit-device').data('id');

				monster.ui.confirm(self.i18n.active().devices.confirmDeleteDevice, function() {
					self.devicesDeleteDevice(deviceId, function(device) {
						popup.dialog('close').remove();

						toastr.success(monster.template(self, '!' + self.i18n.active().devices.deletedDevice, { deviceName: device.name }));

						callbackDelete && callbackDelete(device);
					});
				});
			});

			templateDevice.find('.actions .cancel-link').on('click', function() {
				popup.dialog('close').remove();
			});

			templateDevice.on('change', '.caller-id-select', function() {
				var selectedNumber = this.value;

				var divAddress = templateDevice.find('.number-address');

				divAddress.find('p').empty();

				if (selectedNumber !== '') {
					self.devicesGetE911NumberAddress(selectedNumber, function(address) {
						divAddress.find('p').html(address);
					});

					divAddress.slideDown();
				}
				else {
					divAddress.slideUp();
				}
			});

			templateDevice.find('.restrictions-switch').on('change', function() {
				templateDevice.find('.restriction-matcher-sign').hide();
				templateDevice.find('.restriction-message').hide();
			});

			templateDevice.find('.restriction-matcher-button').on('click', function(e) {
				e.preventDefault();
				var number = templateDevice.find('.restriction-matcher-input').val(),
					matched = false;

				if(number) {
					self.callApi({
						resource: 'numbers.matchClassifier',
						data: {
							accountId: self.accountId,
							phoneNumber: encodeURIComponent(number)
						},
						success: function(data, status) {
							var matchedLine = templateDevice.find('.restriction-line[data-restriction="'+data.data.name+'"]'),
								matchedSign = matchedLine.find('.restriction-matcher-sign'),
								matchedMsg = templateDevice.find('.restriction-message');

							templateDevice.find('.restriction-matcher-sign').hide();
							if(matchedLine.find('.restrictions-switch').prop('checked')) {
								matchedSign.removeClass('monster-red fa-times')
										   .addClass('monster-green fa-check')
										   .css('display', 'inline-block');

								matchedMsg.removeClass('red-box')
										  .addClass('green-box')
										  .css('display', 'inline-block')
										  .empty()
										  .text(
										  	monster.template(self, '!' + self.i18n.active().devices.popupSettings.restrictions.matcher.allowMessage, { phoneNumber: monster.util.formatPhoneNumber(number) })
										  );
							} else {
								matchedSign.removeClass('monster-green fa-check')
										   .addClass('monster-red fa-times')
										   .css('display', 'inline-block');

								matchedMsg.removeClass('green-box')
										  .addClass('red-box')
										  .css('display', 'inline-block')
										  .empty()
										  .text(
										  	monster.template(self, '!' + self.i18n.active().devices.popupSettings.restrictions.matcher.denyMessage, { phoneNumber: monster.util.formatPhoneNumber(number) })
										  );
							}
						}
					});
				} else {
					templateDevice.find('.restriction-matcher-sign').hide();
					templateDevice.find('.restriction-message').hide();
				}
			});

			templateDevice.find('.feature-key-type').on('change', function() {
				var type = $(this).val();

				$(this).siblings('.feature-key-value.active').removeClass('active');
				$(this).siblings('.feature-key-value[data-type="' + type + '"]').addClass('active');
			});

			templateDevice.find('.tabs-section[data-section="featureKeys"] .type-info a').on('click', function() {
				var $this = $(this);

				setTimeout(function() {
					var action = ($this.hasClass('collapsed') ? 'show' : 'hide').concat('Info');

					$this.find('.text').text(self.i18n.active().devices.popupSettings.featureKeys.info.link[action]);
				});
			});

			templateDevice.find('.tabs-section[data-section="WebRTC"] .type-info a').on('click', function() {
				var $this = $(this);

				setTimeout(function() {
					var action = ($this.hasClass('collapsed') ? 'show' : 'hide').concat('Info');

					$this.find('.text').text(self.i18n.active().devices.popupSettings.WebRTC.info.link[action]);
				});
			});

			templateDevice.find('.tabs-section[data-section="provision"] .type-info a').on('click', function() {
				var $this = $(this);

				setTimeout(function() {
					var action = ($this.hasClass('collapsed') ? 'show' : 'hide').concat('Info');

					$this.find('.text').text(self.i18n.active().devices.popupSettings.sip.info.link[action]);
				});
			});

			templateDevice.find('#keytemplate').chosen({search_contains: true, width: "220px;margin-right: 20px;margin-left: 10px;"});
			if(typeof monster.apps.auth.currentAccount.provision !== 'undefined')
				self.devicesDropdown(templateDevice.find('#device_keytemplate'),
								monster.apps.auth.currentAccount.provision.keytemplate||'inherit', { inherit: '1' });

			var popup = monster.ui.dialog(templateDevice, {
				position: ['center', 20],
				title: popupTitle,
				dialogClass: 'voip-edit-device-popup overflow-visible'
//				dialogClass: 'overflow-visible'
			});
		},

		devicesRestart: function(deviceId, callback) {
			var self = this;

			self.callApi({
				resource: 'device.restart',
				data: {
					accountId: self.accountId,
					deviceId: deviceId
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		devicesMergeData: function(originalData, template, audioCodecs, videoCodecs, tx_volume, rx_volume) {
			var self = this,
				hasCodecs = $.inArray(originalData.device_type, ['sip_device', 'landline', 'fax', 'ata', 'softphone', 'smartphone', 'mobile', 'sip_uri']) > -1,
				hasSIP = $.inArray(originalData.device_type, ['fax', 'ata', 'softphone', 'smartphone', 'mobile']) > -1,
				hasCallForward = $.inArray(originalData.device_type, ['landline', 'cellphone', 'smartphone']) > -1,
				hasRTP = $.inArray(originalData.device_type, ['sip_device', 'mobile', 'softphone']) > -1,
				formData = monster.ui.getFormData('form_device');

			if('mac_address' in formData) {
				formData.mac_address = monster.util.formatMacAddress(formData.mac_address);
			}

			if(hasCallForward) {
				formData.call_forward = $.extend(true, {
					enabled: true,
					require_keypress: true,
					keep_caller_id: true
				}, formData.call_forward);

				if (originalData.device_type === 'smartphone') {
					formData.call_forward.failover = true;
				}

				if(formData.hasOwnProperty('extra') && formData.extra.allowVMCellphone) {
					formData.call_forward.require_keypress = !formData.extra.allowVMCellphone;
				}
			}

			if(hasCodecs) {
				formData.media = $.extend(true, {
					audio: {
						codecs: [],
						tx_volume: tx_volume,
						rx_volume: rx_volume
					},
					video: {
						codecs: []
					}
				}, formData.media);
			}

			if(hasSIP) {
				formData.sip = $.extend(true, {
					expire_seconds: 360,
					invite_format: 'username',
					method: 'password'
				}, formData.sip);
			}

			if('call_restriction' in formData) {
				_.each(formData.call_restriction, function(restriction, key) {
					if(key in originalData.extra.restrictions && originalData.extra.restrictions[key].disabled) {
						restriction.action = originalData.extra.restrictions[key].action
					} else {
						restriction.action = restriction.action === true ? 'inherit' : 'deny';
					}
				});
			}

			if('suppress_unregister_notifications' in formData) {
				suppress_unregister_notifications = suppress_unregister_notifications === true ? 'false' : 'true';
			}

			/**
			 * form2object sends feature_keys back as an array even if the first key is 1
			 * feature_key needs to be coerced into an object to match the datatype in originalData
			 */
			if (formData.hasOwnProperty('provision') && formData.provision.hasOwnProperty('feature_keys')) {
				var featureKeys = {};

				formData.provision.feature_keys.forEach(function(val, idx) {
					featureKeys[idx] = val;
				});

				formData.provision.feature_keys = featureKeys;
			}

			var mergedData = $.extend(true, {}, originalData, formData);
			mergedData.name = monster.util.convertUtf8ToAscii(formData.name);

			/* The extend doesn't override an array if the new array is empty, so we need to run these snippet after the merge */
			if(hasRTP) {
				mergedData.media.encryption.methods = [];

				if(mergedData.media.encryption.enforce_security) {
					mergedData.media.encryption.methods.push(formData.extra.rtpMethod);
				}
			}

			if(mergedData.extra.hasOwnProperty('notify_unregister')) {
				mergedData.suppress_unregister_notifications = !mergedData.extra.notify_unregister;
			}

			if(hasCodecs) {
				if(audioCodecs) {
					mergedData.media.audio.codecs = audioCodecs.getSelectedItems();
				}
				
				if(videoCodecs) {
					mergedData.media.video.codecs = videoCodecs.getSelectedItems();
				}
			}

			// If the key is set to "auto" we remove the key, we don't support this anymore
			if(mergedData.hasOwnProperty('media') && mergedData.media.hasOwnProperty('fax_option') && mergedData.media.fax_option === 'auto') {
				delete mergedData.media.fax_option;
			}

			// The UI mistakenly created this key, so we clean it up
			if(mergedData.hasOwnProperty('media') && mergedData.media.hasOwnProperty('fax') && mergedData.media.fax.hasOwnProperty('option')) {
				delete mergedData.media.fax.option;
			}

			// Remove feature keys that are not defined
			if (mergedData.hasOwnProperty('provision') && mergedData.provision.hasOwnProperty('feature_keys')) {
				for (var key in mergedData.provision.feature_keys) {
					if (mergedData.provision.feature_keys[key].type === 'none') {
						delete mergedData.provision.feature_keys[key];
					}
				}

				if (_.isEmpty(mergedData.provision.feature_keys)) {
					delete mergedData.provision.feature_keys;
				}
			}

			/* Migration clean-up */
			delete mergedData.media.secure_rtp;
			delete mergedData.extra;

			return mergedData;
		},

		devicesFormatData: function(data, dataList) {
			var self = this,
				defaults = {
					extra: {
						hasE911Numbers: !_.isEmpty(data.e911Numbers),
						e911Numbers: data.e911Numbers,
						restrictions: data.listClassifiers,
						rtpMethod: data.device.media && data.device.media.encryption && data.device.media.encryption.enforce_security ? data.device.media.encryption.methods[0] : '',
						selectedCodecs: {
							audio: [],
							video: []
						},
						availableCodecs: {
							audio: [],
							video: []
						}
					},
					call_restriction: {},
					device_type: 'sip_device',
					enabled: true,
					media: {
						encryption: {
							enforce_security: false,
						},
						audio: {
							codecs: ['G722', 'PCMU', 'GSM'],
							tx_volume: "0",
							rx_volume: "0"
						},
						video: {
							codecs: []
						}
					},
					suppress_unregister_notifications: true
				},
				typedDefaults = {
					sip_device: {
						sip: {
							password: monster.util.randomString(12),
							realm: monster.apps.auth.currentAccount.realm,
							username: 'user_' + monster.util.randomString(10)
						}
					},
					landline: {
						call_forward: {
							require_keypress: true,
							keep_caller_id: true
						},
						contact_list: {
							exclude: true
						}
					},
					cellphone: {
						call_forward: {
							require_keypress: true,
							keep_caller_id: true
						},
						contact_list: {
							exclude: true
						},
					},
					ata: {
						sip: {
							password: monster.util.randomString(12),
							realm: monster.apps.auth.currentAccount.realm,
							username: 'user_' + monster.util.randomString(10)
						},
						codecs: ['PCMU']
					},
					fax: {
						media: {
							fax_option: 'false'
						},
						outbound_flags: ['fax'],
						sip: {
							password: monster.util.randomString(12),
							realm: monster.apps.auth.currentAccount.realm,
							username: 'user_' + monster.util.randomString(10)
						},
						codecs: ['PCMU']
					},
					softphone: {
						sip: {
							password: monster.util.randomString(12),
							realm: monster.apps.auth.currentAccount.realm,
							username: 'user_' + monster.util.randomString(10)
						},
						codecs: ['GSM'],
						suppress_unregister_notifications: true
					},
					mobile: {
						sip: {
							password: monster.util.randomString(12),
							realm: monster.apps.auth.currentAccount.realm,
							username: 'user_' + monster.util.randomString(10)
						},
						codecs: ['GSM'],
						suppress_unregister_notifications: true
					},
					smartphone: {
						call_forward: {
							require_keypress: true,
							keep_caller_id: true
						},
						contact_list: {
							exclude: true
						},
						sip: {
							password: monster.util.randomString(12),
							realm: monster.apps.auth.currentAccount.realm,
							username: 'user_' + monster.util.randomString(10)
						},
						codecs: ['GSM'],
						suppress_unregister_notifications: true
					},
					sip_uri: {
						sip: {
							password: monster.util.randomString(12),
							username: 'user_' + monster.util.randomString(10),
							expire_seconds: 360,
							invite_format: 'route',
							method: 'password'
						},
						codecs: ['PCMU'],
						suppress_unregister_notifications: true
					}
				};
			

			_.each(data.listClassifiers, function(restriction, name) {
				if(name in self.i18n.active().devices.classifiers) {
					defaults.extra.restrictions[name].friendly_name = self.i18n.active().devices.classifiers[name].name;

					if('help' in self.i18n.active().devices.classifiers[name]) {
						defaults.extra.restrictions[name].help = self.i18n.active().devices.classifiers[name].help;
					}
				}

				if(typeof data.device.accountLimits !== 'undefined') {
					if('call_restriction' in data.accountLimits && name in data.accountLimits.call_restriction && data.accountLimits.call_restriction[name].action === 'deny') {
						defaults.extra.restrictions[name].disabled = true;
						defaults.extra.hasDisabledRestrictions = true;
					}
				}

				if(typeof data.device.call_restriction !== 'undefined') {
					if('call_restriction' in data.device && name in data.device.call_restriction) {
						if(typeof data.device.call_restriction[name].action !== 'undefined')
							defaults.extra.restrictions[name].action = data.device.call_restriction[name].action;
					}
					else {
                                                if(name == 'international') defaults.extra.restrictions[name].action = monster.config.default_international_restriction || 'deny';
                                                else defaults.extra.restrictions[name].action = monster.config.default_restriction || 'inherit';
					}
				}
                                else {
                                        if(name == 'international') defaults.extra.restrictions[name].action = monster.config.default_international_restriction || 'deny';
                                        else defaults.extra.restrictions[name].action = monster.config.default_restriction || 'inherit';
                                }
			});

			var formattedData = $.extend(true, {}, typedDefaults[data.device.device_type], defaults, data.device);

			/* Audio Codecs*/
			/* extend doesn't replace the array so we need to do it manually */
			if(data.device.media && data.device.media.audio && data.device.media.audio.codecs) {
				formattedData.media.audio.codecs = data.device.media.audio.codecs;
			}

			/* Video codecs */
			if(data.device.media && data.device.media.video && data.device.media.video.codecs) {
				formattedData.media.video.codecs = data.device.media.video.codecs;
			}

			formattedData.extra.isRegistered = dataList.isRegistered;

			if(formattedData.hasOwnProperty('call_forward') && formattedData.call_forward.hasOwnProperty('require_keypress')) {
				formattedData.extra.allowVMCellphone = !formattedData.call_forward.require_keypress;
			}

			return formattedData;
		},

		devicesFormatListData: function(data) {
			var self = this,
				formattedData = {
					countDevices: 0,
					devices: {}
				},
				mapUsers = {},
				unassignedString = self.i18n.active().devices.unassignedDevice,
				mapIconClass = {
					cellphone: 'fa fa-phone',
					smartphone: 'icon-telicon-mobile-phone',
					landline: 'icon-telicon-home',
					mobile: 'icon-telicon-sprint-phone',
					softphone: 'icon-telicon-soft-phone',
					sip_device: 'icon-telicon-voip-phone',
					sip_uri: 'icon-telicon-voip-phone',
					fax: 'icon-telicon-fax',
					ata: 'icon-telicon-ata'
				};

			_.each(data.users, function(user) {
				mapUsers[user.id] = user;
			});

			_.each(data.devices, function(device) {
				var isAssigned = device.owner_id ? true : false;

				formattedData.countDevices++;

				formattedData.devices[device.id] = {
					id: device.id,
					isAssigned: isAssigned + '',
					friendlyIconClass: mapIconClass[device.device_type],
					macAddress: device.mac_address,
					name: device.name,
					userName: device.owner_id && device.owner_id in mapUsers ? mapUsers[device.owner_id].last_name + ' ' + mapUsers[device.owner_id].first_name : unassignedString,
					sortableUserName: device.owner_id && device.owner_id in mapUsers ? mapUsers[device.owner_id].last_name + ' ' + mapUsers[device.owner_id].first_name : unassignedString,
					enabled: device.enabled,
					type: device.device_type,
					friendlyType: self.i18n.active().devices.types[device.device_type],
					registered: false,
					classStatus: device.enabled ? 'unregistered' : 'disabled' /* Display a device in black if it's disabled, otherwise, until we know whether it's registered or not, we set the color to red */,
					isRegistered: false
				}
			});

			_.each(data.status, function(status) {
				if(status.registered === true && status.device_id in formattedData.devices) {
					var device = formattedData.devices[status.device_id];

					device.registered = true;

					/* Now that we know if it's registered, we set the color to green */
					if(device.enabled) {
						device.classStatus = 'registered';
						device.isRegistered = true;
					}
				}
			});

			var arrayToSort = [];

			_.each(formattedData.devices, function(device) {
				arrayToSort.push(device);
			});

			arrayToSort.sort(function(a, b) {
				/* If owner is the same, order by device name */
				if(a.userName === b.userName) {
					var aName = a.name.toLowerCase(),
						bName = b.name.toLowerCase();

					return (aName > bName) ? 1 : (aName < bName) ? -1 : 0;
				}
				else {
					/* Otherwise, push the unassigned devices to the bottom of the list, and show the assigned devices ordered by user name */
					if(a.userName === unassignedString) {
						return 1;
					}
					else if(b.userName === unassignedString) {
						return -1;
					}
					else {
						var aSortName = a.sortableUserName.toLowerCase(),
							bSortName = b.sortableUserName.toLowerCase();

						return (aSortName > bSortName) ? 1 : (aSortName < bSortName) ? -1 : 0;
					}
				}
			});

			formattedData.devices = arrayToSort;

			return formattedData;
		},

		/* Utils */
		devicesDeleteDevice: function(deviceId, callback) {
			var self = this;

			self.callApi({
				resource: 'device.delete',
				data: {
					accountId: self.accountId,
					deviceId: deviceId,
					data: {}
				},
				success: function(data) {
					callback(data.data);
				}
			});
		},

		devicesListClassifiers: function(callback) {
			var self = this;

			self.callApi({
				resource: 'numbers.listClassifiers',
				data: {
					accountId: self.accountId
				},
				success: function(data) {
					callback(data.data);
				}
			});
		},

		devicesGetE911Numbers: function(callback) {
			var self = this;

			self.callApi({
				resource: 'numbers.list',
				data: {
					accountId: self.accountId,
					filters: {
						paginate: 'false'
					}
				},
				success: function(data) {
					monster.pub('common.numbers.getListFeatures', function(viewFeatures) {
						var e911Numbers = {};
						_.each(data.data.numbers, function(val, key) {
							if(val.features.indexOf('dash_e911') >= 0) {
								e911Numbers[key] = self.devicesFormatNumber(val, viewFeatures);
							}
						});

						callback(e911Numbers);
					});
				}
			});
		},

		devicesFormatNumber: function(value, viewFeatures) {
			var self = this;

			value.viewFeatures = $.extend(true, {}, viewFeatures);
			if('locality' in value) {
				value.isoCountry = value.locality.country || '';
				value.friendlyLocality = 'city' in value.locality ? value.locality.city + ('state' in value.locality ? ', ' + value.locality.state : '') : '';
			}

			_.each(value.features, function(feature) {
				if(feature in value.viewFeatures) {
					value.viewFeatures[feature].active = 'active';
				}
			});

			return value;
		},

		devicesGetEditData: function(dataDevice, callback) {
			var self = this;

			monster.parallel({
					listClassifiers: function(callback) {
						self.devicesListClassifiers(function(dataClassifiers) {
							callback(null, dataClassifiers);
						});
					},
					device: function(callback) {
						if(dataDevice.id) {
							self.devicesGetDevice(dataDevice.id, function(dataDevice) {
								callback(null, dataDevice);
							});
						}
						else {
							callback(null, dataDevice);
						}
					},
					e911Numbers: function(callback) {
						self.devicesGetE911Numbers(function(e911Numbers) {
							callback(null, e911Numbers);
						});
					},
					accountLimits: function(callback) {
						self.callApi({
							resource: 'limits.get',
							data: {
								accountId: self.accountId
							},
							success: function(data, status) {
								callback(null, data.data);
							}
						});
					}
				},
				function(error, results) {
					var formattedData = self.devicesFormatData(results, dataDevice);

					callback && callback(formattedData);
				}
			);
		},

		devicesGetDevice: function(deviceId, callbackSuccess, callbackError) {
			var self = this;

			self.callApi({
				resource: 'device.get',
				data: {
					accountId: self.accountId,
					deviceId: deviceId
				},
				success: function(data) {
					callbackSuccess && callbackSuccess(data.data);
				},
				error: function(data) {
					callbackError && callbackError(data);
				}
			});
		},

		devicesSaveDevice: function(deviceData, callback) {
			var self = this;

			if(typeof deviceData.id !== 'undefined') {
				if(typeof deviceData.provision == "string") delete deviceData.provision.provstring;
				self.devicesUpdateDevice(deviceData, callback);
			}
			else {
				self.devicesCreateDevice(deviceData, callback);
			}
		},

		devicesCreateDevice: function(deviceData, callback) {
			var self = this;

			if(typeof deviceData.account == "object") delete deviceData.account;

			self.callApi({
				resource: 'device.create',
				data: {
					accountId: self.accountId,
					data: deviceData
				},
				success: function(data) {
					callback(data.data);
				}
			});
		},

		devicesUpdateDevice: function(deviceData, callbackSuccess, callbackError) {
			var self = this;

			self.callApi({
				resource: 'device.update',
				data: {
					accountId: self.accountId,
					data: deviceData,
					deviceId: deviceData.id
				},
				success: function(data) {
					callbackSuccess && callbackSuccess(data.data);
				},
				error: function(data) {
					callbackError && callbackError(data);
				}
			});
		},

		devicesGetData: function(callback) {
			var self = this;

			monster.parallel({
					users: function(callback) {
						self.callApi({
							resource: 'user.list',
							data: {
								accountId: self.accountId,
								filters: {
									paginate: 'false'
								}
							},
							success: function(dataUsers) {
								callback && callback(null, dataUsers.data);
							}
						});
					},
					status: function(callback) {
						self.callApi({
							resource: 'device.getStatus',
							data: {
								accountId: self.accountId,
								filters: {
									paginate: 'false'
								}
							},
							success: function(dataStatus) {
								callback && callback(null, dataStatus.data);
							}
						});
					},
					devices: function(callback) {
						self.callApi({
							resource: 'device.list',
							data: {
								accountId: self.accountId,
								filters: {
									paginate: 'false'
								}
							},
							success: function(dataDevices) {
								callback(null, dataDevices.data);
							}
						});
					}
				},
				function(err, results) {
					callback && callback(results);
				}
			);
		},

		devicesGetE911NumberAddress: function(number, callback) {
			var self = this;

			self.callApi({
				resource: 'numbers.get',
				data: {
					accountId: self.accountId,
					phoneNumber: encodeURIComponent(number)
				},
				success: function(_data, status) {
					var street_address = _data.data.dash_e911.street_address,
						locality = _data.data.dash_e911.locality,
						postal_code = _data.data.dash_e911.postal_code,
						region = _data.data.dash_e911.region;

					if ( typeof _data.data.dash_e911.extended_address !== 'undefined' ) {
						callback(street_address + ', ' + _data.data.dash_e911.extended_address + '<br>' + locality + ', ' + region + ' ' + postal_code);
					} else {
						callback(street_address + ', ' + '<br>' + locality + ', ' + region + ' ' + postal_code);
					}
				}
			});
		},

		devicesGetIterator: function(args, callbackSuccess, callbackError) {
			var self = this;

			if(args.hasOwnProperty('endpoint_brand') && args.hasOwnProperty('endpoint_family') && args.hasOwnProperty('endpoint_model')) {
				monster.request({
					resource: 'provisioner.ui.getModel',
					data: {
						brand: args.endpoint_brand,
						family: args.endpoint_family,
						model: args.endpoint_model
					},
					success: function(data, status) {
					callbackSuccess && callbackSuccess(data.data.template);
					},
					error: function(data, status) {
					}
				});
			} else {
				callbackError && callbackError();
			}
		}
	};
	return app;
});
