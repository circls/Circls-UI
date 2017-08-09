define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr'),
                chosenImage = require('chosenImage'),
                flags = require('monster-flags');

	var buyDevices = {

//		externalScripts: [ 'buyDevices-googleMapsLoader' ],

		requests: {
			// list endpoints with price
			'devicesuppliers.searchDevices': {
				apiRoot: monster.config.api.devicesuppliers,
				url: '?type=searchDevices',
				verb: 'POST',
                                accountId: '{accountId}',
                                devices: '{devices}',
                                country: '{country}',
                                currency: '{currency}',
                                headers: {
                                        Accept: '*/*'
                                },
				generateError: false
			},
			// buy Chart List
			'devicesuppliers.BuyChart': {
				apiRoot: monster.config.api.devicesuppliers,
				url: '?type=buyChart',
				verb: 'GET',
                                accountId: '{accountId}',
                                country: '{country}',
                                currency: '{currency}',
                                headers: {
                                        Accept: '*/*'
                                },
				generateError: false
			},
			// cancel Chart
			'devicesuppliers.cancelChart': {
				apiRoot: monster.config.api.devicesuppliers,
				url: '?type=cancelChart',
				verb: 'GET',
                                accountId: '{accountId}',
                                country: '{country}',
                                currency: '{currency}',
                                headers: {
                                        Accept: '*/*'
                                },
				generateError: false
			},
			// get avaiable Countries
                        'devicesuppliers.searchByCountries': {
                                apiRoot: monster.config.api.phonebook,
                                url: '?type=searchCountries',
                                verb: 'GET',
                                accountId: '{accountId}',
                                currency: '{currency}',
                                headers: {
                                        Accept: '*/*'
                                },
                                generateError: false
                        }
		},

		subscribe: {
			'common.buyDevices': 'buyDevicesRender',
			'common.buyDevicesGetAvailableCountries': 'buyDevicesGetAvailableCountries',
		},

		appFlags: {
			searchLimit: 15,
			isDevicesuppliersConfigured: monster.config.api.hasOwnProperty('devicesuppliers'),
			isSelectedDevicesEmpty: true
		},

		buyDevicesRender: function(params) {
			var self = this,
				params = params || {},
				args = {
					searchType: params.searchType || 'device',
					singleSelect: params.singleSelect || false,
				};

			self.assignedAccountId = params.accountId || self.accountId;

			self.buyDevicesGetAvailableCountries(function(countries) {
				args.availableCountries = countries;
				self.buyDevicesShowPopup(args, params.callbacks);
			});
		},

		buyDevicesGetAvailableCountries: function(callback) {
			var self = this;
			monster.request({
				resource: 'devicesuppliers.searchByCountries',
				data: {
					accountId: self.assignedAccountId,
					apitoken: self.apitoken
				},
				success: function(data, status) {
					callback(data.data);
				},
				error: function(data, status) {
					toastr.error(self.i18n.active().buyDevices.unavailableServiceAlert);
				}
			});
		},

		buyDevicesShowPopup: function(args, callbacks) {
			var self = this,
				searchType = args.searchType,
				availableCountries = args.availableCountries,
				template = $(monster.template(self, 'buyDevices-layout', {
					isDevicesuppliersConfigured: self.appFlags.isDevicesuppliersConfigured
				}));

			args.popup = monster.ui.dialog(template, {
				title: self.i18n.active().buyDevices.buyDialogTitle,
				width: '500px',
				position: ['center', 40]
			});

			$.extend(true, args, {
				container: template,
				displayedDevices: [],
				selectedDevices: [],
				isSearchFunctionEnabled: false
			});

			template.find('.start-hidden').hide();
			template.find('.device-search').hide();
			template.find('.pbx-search').hide();

                        flags.availableDropdown(template.find('#metadata_country'), {available: availableCountries, selected: self.i18n.active().buyDevices.defaultCountry});
                        template.find('#metadata_country').chosenImage({ search_contains: true, width: '200px' });

                        flags.availableDropdown(template.find('#meta_country'), {available: availableCountries, selected: self.i18n.active().buyDevices.defaultCountry});
                        template.find('#meta_country').chosenImage({ search_contains: true, width: '200px' });

			switch(searchType) {
				case 'pbx':
					self.buyDevicesRenderpbx(args);
					break;

				case 'device':
				default:
					self.buyDevicesRenderDevices(args);
					break;
			};

			self.buyDevicesBindEvents(args, callbacks || {});
		},

		buyDevicesBindEvents: function(args, callbacks) {
			var self = this,
				container = args.container,
				searchResultDiv = container.find('#search_result_div'),
				resultDiv = searchResultDiv.find('.left-div'),
				purchaseDevices = function() {
					var devices = self.buyDevicesSelectedDevicesToArray(args.selectedDevices, args.availableCountries[countrySelect].prefix),
						processingDiv = container.find('#processing_purchase_div');
					
					processingDiv.show();
					processingDiv.find('i.fa-spinner').addClass('fa-spin');
					
					self.buyDevicesRequestActivateBlock({
						data: {
							accountId: self.assignedAccountId,
							data: {
								devices: devices
							}
						},
						success: function(data) {
							if (data.hasOwnProperty('success') && !_.isEmpty(data.success)) {
								callbacks.hasOwnProperty('success') && callbacks.success(data.success);
							}
							args.popup.dialog('close');
						},
						error: function(data) {
							if (!_.isEmpty(data)) {
								var errMsg = self.i18n.active().buyDevices.partialPurchaseFailure + ' ' + Object.keys(data).join(' ');
								toastr.error(errMsg);
							}
							args.popup.dialog('close');
							callbacks.hasOwnProperty('error') && callbacks.error();
						},
						cancel: function() {
							self.buyDevicesShowSearchResults(args);
							processingDiv.hide();
						}
					});
				};

			searchResultDiv.on('click', 'i.remove-device', function(ev) {
				ev.preventDefault();
				var $this = $(this),
					removedIndex = $this.data('index'),
					removedArrayIndex = $this.data('array_index');
					if (args.singleSelect) {
						$.each(container.find('.add-device'), function(idx, val) {
							$(this)
								.removeClass('disabled')
								.prop('disabled', false);
						});
						self.appFlags.isSelectedDevicesEmpty = true;
						container
							.find('#single_select_info')
								.removeClass('hidden');
					}
				args.selectedDevices.splice(removedIndex,1);
				self.buyDevicesRefreshSelectedDevicesList(args);

				delete args.displayedDevices[removedArrayIndex].selected;
				container.find('#'+removedArrayIndex+"_div").show();
			});

			searchResultDiv.on('click', 'button.add-device', function(ev) {
				ev.preventDefault();
				var addedIndex = $(this).data('array_index');
				if (args.singleSelect) {
					$.each(container.find('.add-device'), function(idx, val) {
						$(this)
							.addClass('disabled')
							.prop('disabled', true);
					});
					self.appFlags.isSelectedDevicesEmpty = false;
						container
							.find('#single_select_info')
								.addClass('hidden');
				}
				args.selectedDevices.push(args.displayedDevices[addedIndex]);
				self.buyDevicesRefreshSelectedDevicesList(args);

				args.displayedDevices[addedIndex].selected = true;
				container.find('#'+addedIndex+"_div").hide("slide", { direction: "right" }, 300);
				if(resultDiv.children('.device-box').height() * resultDiv.children('.device-box:visible').length <= resultDiv.innerHeight()) {
					resultDiv.scroll();
				}
			});

			container.find('#buy_devices_button').on('click', function(ev) {
				ev.preventDefault();
				var totalDevices = self.buyDevicesGetTotalDevices(args.selectedDevices);

				if(totalDevices > 0) {
					container.find('#search_top_div').hide();
					container.find('#search_result_div').hide();
					container.find('#check_devices_div').show();

					self.buyDevicesToggleCheckingDiv(container, true);
					setTimeout(function() {
						self.buyDevicesToggleCheckingDiv(container, false);
						var unavailableDevices = [];
						if(unavailableDevices.length > 0) {
							container.find('#check_devices_div .unavailable-div .unavailable-devices')
									 .empty()
									 .append(monster.template(self, 'buyDevices-unavailableDevices', {devices: unavailableDevices}));
						} else {
							container.find('#check_devices_div').hide();
							purchaseDevices();
						}
					}, 1000);
				} else {
					toastr.error(self.i18n.active().buyDevices.noSelectedNumAlert);
				}
			});

			container.find('#back_to_results_link').on('click', function(ev) {
				ev.preventDefault();
				self.buyDevicesShowSearchResults(args);
				container.find('#check_devices_div').hide();
			});

			container.find('#continue_buy_button').on('click', function(ev) {
				ev.preventDefault();
				container.find('#check_devices_div').hide();
				purchaseDevices();
			});
		},

		buyDevicesRenderpbx: function(args, callback) {
			var self = this,
				container = args.container,
				availableCountries = args.availableCountries,
				countryData = [];

			$.each(availableCountries, function(key, value) {
				if(value.toll_free && value.toll_free.length > 0) {
					key === "US" ? countryData.splice(0, 0, self.buyDevicesFormatCountryListElement(key,value)) : countryData.push(self.buyDevicesFormatCountryListElement(key,value));
				}
			});

			var pbxPrefixes = availableCountries[self.i18n.active().buyDevices.defaultCountry].toll_free,
				radioGroup = container.find('#pbx_radio_group');

			radioGroup.empty()
			.append(monster.template(self, 'buyDevices-pbx', {pbxPrefixes: pbxPrefixes}));
			radioGroup.find('input:radio:first').prop('checked', true);
			container.find('.pbx-search').show();

			self.buyDevicesBindPbxEvents(args);
		},

		buyDevicesBindPbxEvents: function(args) {
			var self = this,
				container = args.container,
				availableCountries = args.availableCountries,
				countryToll = container.find('#meta_country').val(),
				searchResultDiv = container.find('#search_result_div'),
				resultDiv = searchResultDiv.find('.left-div'),
				performSearch = function(_offset, _limit, _callback) { /* To be implemented in search button click event */ },
				loadingNewDevices = false,
				searchOffset = 0;

			container.find('#pbx_search_button').on('click', function(ev) {
				ev.preventDefault();
				var pbxPrefix = container.find('#pbx_radio_group input[type="radio"]:checked').val();

				performSearch = function(_offset, _limit, _callback) {
					loadingNewDevices = true;
					resultDiv.append(monster.template(self, 'buyDevices-loadingDevices', {}));
					resultDiv[0].scrollTop = resultDiv[0].scrollHeight;
					self.buyDevicesRequestSearchDevices({
						data: {
							country: availableCountries[countryToll].prefix,
							pattern: pbxPrefix.replace(/^0/,''),
							offset: _offset,
							limit: _limit
						},
						success: function(data) {
							if(data && data.length > 0) {
								$.each(data, function(key, value) {
									var num = value.device,
										prefix = "+" + availableCountries[countrySelect].prefix;
									if(num.indexOf(prefix) === 0) { num = num.substring(prefix.length); }
									args.displayedDevices.push({
										array_index: args.displayedDevices.length,
										device_value: num,
										formatted_value: self.buyDevicesFormatDevice(num, countrySelect)
									});
								});

								searchOffset += _limit;
							} else {
								args.isSearchFunctionEnabled = false;
							}

							_callback && _callback();
							loadingNewDevices = false;
						},
						error: function() {
							toastr.error(self.i18n.active().buyDevices.unavailableServiceAlert);
							_callback && _callback();
							loadingNewDevices = false;
						}
					});
				};

				args.displayedDevices = [];
				args.selectedDevices = [];
				searchOffset = 0;
				args.isSearchFunctionEnabled = true;
				resultDiv.empty();
				performSearch(searchOffset, self.appFlags.searchLimit, function() {
					self.buyDevicesRefreshDisplayedDevicesList(args);
					self.buyDevicesRefreshSelectedDevicesList(args);
				});

				if(searchResultDiv.css('display') === 'none') {
					searchResultDiv.slideDown();
				}
			});

		},

		buyDevicesRenderDevices: function(args, callback) {
			var self = this,
				container = args.container,
				availableCountries = args.availableCountries,
				countryData = [];

			$.each(availableCountries, function(key, value) {
				if(value.local) {
					key === "US" ? countryData.splice(0, 0, self.buyDevicesFormatCountryListElement(key,value)) : countryData.push(self.buyDevicesFormatCountryListElement(key,value));
				}
			});

			container.find('.device-search').show();

			self.buyDevicesBindDeviceEvents(args);
		},

		buyDevicesBindDeviceEvents: function(args) {
			var self = this,
				container = args.container,
				selectedCity,
				cityList = {},
				searchResultDiv = container.find('#search_result_div'),
				resultDiv = searchResultDiv.find('.left-div'),
				performSearch = function(_offset, _limit, _callback) { /* To be implemented in search button click event */ },
				loadingNewDevices = false,
				availableCountries = args.availableCountries,
				searchOffset = 0;

			container.find('#search_devices_button').on('click', function(ev) {
				ev.preventDefault();

				var seqNumIntvalue = parseInt(container.find('#seq_num_input').val(),10) || 1,
				isSeqNumChecked = container.find('#seq_num_checkbox').prop('checked'),
				cityInput = container.find('#city_input').val(),
				countrySelect = container.find('#metadata_country').val();

				performSearch = function(_offset, _limit, _callback) {
					loadingNewDevices = true;
					resultDiv.append(monster.template(self, 'buyDevices-loadingDevices', {}));
					resultDiv[0].scrollTop = resultDiv[0].scrollHeight;
					self.devicesGetData(function(devices) {
						var buydevices = {};
						$.each(devices, function(key, value) {
							if(typeof value.provision === "object")
							if(value.provision.endpoint_model)
							    if(buydevices[value.provision.endpoint_brand +" "+ value.provision.endpoint_model]) {
								buydevices[value.provision.endpoint_brand +" "+ value.provision.endpoint_model]++;
							    } else buydevices[value.provision.endpoint_brand +" "+ value.provision.endpoint_model] = 1;
						});

						self.buyDevicesRequestSearchDevices({
							data: {
								currency: self.i18n.active().currencyUsed,
								country: countrySelect,
								devices: buydevices
							},
							success: function(data) {
								if(data && data.length > 0) {
									$.each(data, function(key, value) {
										var num = value.device,
										prefix = "+"+ availableCountries[countrySelect].prefix;
										if(num.indexOf(prefix) === 0) { num = num.substring(prefix.length); }
										args.displayedDevices.push({
											array_index: args.displayedDevices.length,
											device_value: num,
											formatted_value: self.buyDevicesFormatDevice(num, countrySelect)
										});
									});
									searchOffset += _limit;
								} else {
									args.isSearchFunctionEnabled = false;
								}
								_callback && _callback();
							loadingNewDevices = false;
							},
							error: function() {
								toastr.error(self.i18n.active().buyDevices.unavailableServiceAlert);
								_callback && _callback();
								loadingNewDevices = false;
							}
						});
					});
				};
				container.find('#search_parameters').html(countrySelect);

				args.displayedDevices = [];
				args.selectedDevices = [];
				searchOffset = 0;
				args.isSearchFunctionEnabled = true;
				resultDiv.empty();
				performSearch(searchOffset, self.appFlags.searchLimit, function() {
					self.buyDevicesRefreshDisplayedDevicesList(args);
					self.buyDevicesRefreshSelectedDevicesList(args);
				});
				container.find('#search_top_div').slideUp(function() {
					searchResultDiv.slideDown();
				});
			});

			container.find('#back_to_search').click(function(ev) {
				ev.preventDefault();

				searchResultDiv.find('.result-content-div .left-div').scrollTop(0);
				searchResultDiv.slideUp(function() {
					container.find('#search_top_div').slideDown();
				});
			});

		},

		buyDevicesFormatDevice: function(startDevice, countryCode, endDevice, addPrefix) {
			var self = this,
				device = startDevice.toString(),
				countryCode = countryCode || "US",
				endDevice = endDevice ? endDevice.toString() : device,
				result = device;

			switch(countryCode) {
				case "US":
					result = (addPrefix ? "+"+addPrefix+" " : "") + device.replace(/(\d{3})(\d{3})(\d{4})/,'($1) $2-$3');
					break;
				default:
					result = (addPrefix ? "+"+addPrefix : "") + device;
					break;
			}

			if(endDevice.length === device.length && endDevice !== device) {
				result += " "+self.i18n.active().buyDevices.to+" " + endDevice.substr(endDevice.length - 4);
			}

			return result;
		},

		buyDevicesGetTotalDevices: function(selectedDevices) {
			var matched,
				result = 0;

			$.each(selectedDevices, function(key, value) {
				matched = value.device_value.match(/\d+_(\d+)/);
				if(matched) { result += parseInt(matched[1], 10); }
				else { result += 1; }
			});

			return result;
		},

		buyDevicesFormatCountryListElement: function(k, v) {
			return {
				text: v.name,
				value: k,
				imageSrc: "css/assets/flags/32/"+k+".png"
			}
		},

		buyDevicesRefreshSelectedDevicesList: function(args) {
			var self = this,
				container = args.container,
				selectedDevicesList = monster.template(self, 'buyDevices-selectedDevices', {
					devices: args.selectedDevices,
					isSingleSelect: args.singleSelect
				}),
				totalDevices = self.buyDevicesGetTotalDevices(args.selectedDevices);

			container.find('#search_result_div .right-div .center-div').empty().append(selectedDevicesList);
			container.find('#total_num_span').html(totalDevices);

			// display the plural if there's more than 1 device added
			textAdded = (totalDevices === 0 || totalDevices === 1) ? self.i18n.active().buyDevices.deviceAddedSingle : self.i18n.active().buyDevices.deviceAddedPlural;
			container.find('.device-added').html(textAdded);
		},

		buyDevicesRefreshDisplayedDevicesList: function(args) {
			var self = this,
				container = args.container,
				searchResultsList = monster.template(self, 'buyDevices-searchResults', { devices: args.displayedDevices }),
				resultDiv = container.find('#search_result_div .left-div');

			resultDiv.empty().append(searchResultsList);

			if (args.singleSelect) {
				if (!self.appFlags.isSelectedDevicesEmpty) {
					$.each(resultDiv.find('.add-device'), function(idx, val) {
						$(this)
							.addClass('disabled')
							.prop('disabled', true);
					});
				}
			}

			if(!args.isSearchFunctionEnabled && resultDiv[0].scrollHeight > resultDiv.height()) {
				resultDiv.children('.device-box.device-wrapper').last().css('border-bottom','none');
			}
		},

		buyDevicesShowSearchResults: function(args) {
			var self = this,
				container = args.container,
				searchResultDiv = container.find('#search_result_div'),
				searchType = args.searchType;

			if(searchType === 'pbx') {
				container.find('#search_top_div').show();
			}
			searchResultDiv.show();

			self.buyDevicesRefreshDisplayedDevicesList({
				container: searchResultDiv,
				displayedDevices: args.displayedDevices,
				isSearchFunctionEnabled: args.isSearchFunctionEnabled
			});
			self.buyDevicesRefreshSelectedDevicesList({
				container: searchResultDiv,
				selectedDevices: args.selectedDevices
			});
		},

		buyDevicesToggleCheckingDiv: function(container, toggle) {
			var checkingDiv = container.find('#check_devices_div .checking-div'),
				unavailableDiv = container.find('#check_devices_div .unavailable-div');
			if(toggle) {
				unavailableDiv.hide();
				checkingDiv.show();
				checkingDiv.find('i.fa-spinner').addClass('fa-spin');
			} else {
				unavailableDiv.show();
				checkingDiv.hide();
				checkingDiv.find('i.fa-spinner').removeClass('fa-spin');
			}
		},

		buyDevicesSelectedDevicesToArray: function(selectedDevices, prefix) {
			var result = [],
				prefix = prefix.toString().indexOf("+") < 0 ? "+"+prefix : prefix;
			_.each(selectedDevices, function(val) {
				var block = val.device_value.match(/([0-9]+)_([0-9]+)/),
					device = block ? block[1] : val.device_value;
				if(block) {
					for(i=0; i<parseInt(block[2]); i++) {
						result.push(prefix+ (parseInt(device)+i) );
					}
				} else {
					result.push(prefix+device);
				}
			});

			return result;
		},

		/**
		 * Initialize and render the map with the list of locations displayed as
		 * markers. Bind a click event on each marker to show the related data.
		 * Initialize the map and show the list of locations as markers
		 * @param  {Object} mapData         List of locations to show on the map
		 */
		buyDevicesInitAreaCodeMap: function(mapData) {
			var self = this,
				init = function init () {
					var bounds = new google.maps.LatLngBounds(),
						infoWindow = new google.maps.InfoWindow(),
						mapOptions = {
							panControl: false,
							zoomControl: true,
							mapTypeControl: false,
							scaleControl: true,
							streetViewControl: false,
							overviewMapControl: true
						},
						map = new google.maps.Map(document.getElementById('area_code_map'), mapOptions);

					_.each(mapData.locales, function(markerValue, markerKey) {
						bounds.extend(setMarker(map, infoWindow, markerKey, markerValue).getPosition());
					});

					// Center the map to the geometric center of all bounds
					map.setCenter(bounds.getCenter());
					// Sets the viewport to contain the given bounds
					map.fitBounds(bounds);
				},
				setMarker = function setMarker (map, infoWindow, key, value) {
					var position = new google.maps.LatLng(parseFloat(value.latitude), parseFloat(value.longitude)),
						markerOptions = {
							animation: google.maps.Animation.DROP,
							areaCodes: value.prefixes,
							position: position,
							title: key,
							map: map
						},
						marker = new google.maps.Marker(markerOptions);

					marker.addListener('click', function () {
						infoWindow.setContent(
							'<p>' + self.i18n.active().buyDevices.markerAreaCodes + this.title + ':</p/>' + 
							'<ul>' + 
								'<li><b>' + this.areaCodes.join('<b/></li><li><b>') + '</b>' + '</li>' + 
							'</ul>'
						);
						infoWindow.open(map, marker);
					});

					return marker;
				};

			init();
		},

		/**************************************************
		 *            Data manipulation helpers           *
		 **************************************************/

		/**
		 * If the 'structure' parameter is an Object, coerce it to an Array and
		 * returns it or returns the Array if 'structure' is already an Array.
		 * @param  {Object|Array} structure List to coerce to Array
		 * @return {Array}                  Array created from 'structure'
		 */
		buyDevicesCoerceObjectToArray: function(structure) {
			return _.isArray(structure) ? structure : _.map(structure, function(v) { return v; });
		},

		/**
		 * Extract the area code of each prefix value for each city and remove
		 * duplicate occurences.
		 * @param  {Object} cities List of cities containing prefixes
		 * @return {Object}        Same list with duplicate area codes removed
		 */
		buyDevicesGetUniqueAreaCodes: function(cities) {
			_.each(cities, function(cityValue, cityKey, citiesObject) {
				cityValue.prefixes = _.map(cityValue.prefixes, function(prefixValue, prefixIdx) { return prefixValue.substr(0, 3); });
				citiesObject[cityKey].prefixes = _.uniq(cityValue.prefixes);
			});

			return cities;
		},

		/**************************************************
		 *              Requests declarations             *
		 **************************************************/

		// Activation Requests
		buyDevicesRequestActivateBlock: function(args) {
			var self = this;

			self.callApi({
				resource: 'devices.activateBlock',
				data: $.extend(true, {}, args.data, {
					generateError: false
				}),
				success: function (data, status, globalHandler) {
					args.hasOwnProperty('success') && args.success(data.data);
				},
				error: function (data, status, globalHandler) {
					if (data.error !== '402' && typeof data.data !== 'string') {
						args.error && args.error(data.data);
					}
					else {
						globalHandler(data, { generateError: true });

						args.cancel && args.cancel();
					}
				},
				onChargesCancelled: function () {
					args.cancel && args.cancel();
				}
			});
		},

		// Search Requests
		buyDevicesRequestSearchDevices: function(args) {
			var self = this;
console.log(args.data);
				settings = {
					resource: monster.config.api.devicesuppliers ? 'devicesuppliers.searchDevices' : 'devices.search',
					data: args.data,
					success: function(data, status) {
						args.hasOwnProperty('success') && args.success(self.buyDevicesCoerceObjectToArray(data.data));
					},
					error: function(data, status) {
						args.hasOwnProperty('error') && args.error();
					}
				};

			if (self.appFlags.isDevicesuppliersConfigured) {
				monster.request(settings);
			}
			else {
				self.callApi(settings);
			}
		},

		buyDevicesRequestSearchBlockOfDevices: function(args) {
			var self = this,
				settings = {
					resource: self.appFlags.isDevicesuppliersConfigured ? 'devicesuppliers.searchBlocks' : 'devices.searchBlocks',
					data: args.data,
					success: function(data, status) {
						args.hasOwnProperty('success') && args.success(data.data);
					},
					error: function(data, status) {
						args.hasOwnProperty('error') && args.error();
					}
				};

			if (self.appFlags.isDevicesuppliersConfigured) {
				monster.request(settings);
			}
			else {
				self.callApi(settings);
			}
		},

		buyDevicesRequestSearchDevicesByCity: function(args) {
			var self = this;
			monster.request({
				resource: self.appFlags.isDevicesuppliersConfigured ? 'devicesuppliers.searchCity' : 'devices.searchCity',
				data: args.data,
				success: function(data, status) {
					args.hasOwnProperty('success') && args.success(data.data);
				},
				error: function(data, status) {
					args.hasOwnProperty('error') && args.error();
				}
			});
		},

		buyDevicesRequestSearchAreaCodeByAddress: function(args) {
			var self = this;

			monster.request({
				resource: self.appFlags.isDevicesuppliersConfigured ? 'devicesuppliers.searchByAddress' : 'devices.searchByAddress',
				data: args.data,
				success: function(data, status) {
					args.hasOwnProperty('success') && args.success($.extend(true, data.data, {
						locales: self.buyDevicesGetUniqueAreaCodes(data.data.locales)
					}));
				},
				error: function(data, status) {
					if (status.status === 404) {
						args.hasOwnProperty('error') && args.error();
					}
				}
			});
		},

		add_devices: function(devices_data, callback, devices_bought) {
			var self = this,
				device_data,
				devices_bought = devices_bought || [];

			if(devices_data.length > 0) {
				var phone_device = devices_data[0].phone_device.match(/^\+?1?([2-9]\d{9})$/),
					error_function = function() {
						monster.ui.confirm('There was an error when trying to acquire ' + devices_data[0].phone_device +
							', would you like to retry?',
							function() {
								self.add_devices(devices_data, callback, devices_bought);
							},
							function() {
								self.add_devices(devices_data.slice(1), callback, devices_bought);
							}
						);
					};

				if(phone_device[1]) {
					self.activate_device(phone_device[1],
						function(_data, status) {
							devices_bought.push(_data.data.id);
							self.add_devices(devices_data.slice(1), callback, devices_bought);
						},
						function(_data, status) {
							error_function();
						}
					);
				}
				else {
					error_function();
				}
			}
			else {
				if(typeof callback === 'function') {
					callback(devices_bought);
				}
			}
		},

		activate_device: function(phone_device, success, error) {
			var self = this;

			monster.request(false, 'buyDevices.activateDevice', {
					account_id: monster.ui.apps['auth'].account_id,
					api_url: monster.ui.apps['auth'].api_url,
					phone_device: encodeURIComponent(phone_device),
					data: {}
				},
				function(_data, status) {
					if(typeof success == 'function') {
						success(_data, status);
					}
				},
				function(_data, status) {
					if(typeof error == 'function') {
						error(_data, status);
					}
				}
			);
		},

                devicesGetData: function(callback) {
                        var self = this;
                        self.callApi({
                                resource: 'device.list',
                                data: {
                                        accountId: self.accountId,
                                        filters: {
                                                paginate: 'false'
                                        }
                                },
                                success: function(dataDevices) {
                                        callback(dataDevices.data);
                                }
                        });
                }
	};

	return buyDevices;
});
