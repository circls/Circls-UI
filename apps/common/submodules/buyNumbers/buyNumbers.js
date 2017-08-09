define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr'),
                chosenImage = require('chosenImage'),
                flags = require('monster-flags');

	var buyNumbers = {

		externalScripts: [ 'buyNumbers-googleMapsLoader' ],

		requests: {
			// Numbers endpoints
			'phonebook.search': {
				'apiRoot': monster.config.api.phonebook,
				'url': '?type=search&country={country}&prefix={pattern}&limit={limit}&offset={offset}',
				'verb': 'GET',
                                'headers': {
                                        Accept: '*/*'
                                },
				generateError: false
			},
			'phonebook.searchBlocks': {
				'apiRoot': monster.config.api.phonebook,
				'url': '?type=searchBlocks&country={country}&prefix={pattern}&limit={limit}&offset={offset}&size={size}',
				'verb': 'GET',
                                'headers': {
                                        Accept: '*/*'
                                },
				generateError: false
			},
			// Locality endpoints
			'phonebook.searchCity': {
				'apiRoot': monster.config.api.phonebook,
				'url': '?type=searchCity&city={cityInput}',
				'verb': 'POST',
                                'headers': {
                                        Accept: '*/*'
                                },
				generateError: false
			},
			// Locality endpoints
			'phonebook.searchByAddress': {
				'apiRoot': monster.config.api.phonebook,
				'url': '?type=searchByAddress&city={cityInput}',
				'verb': 'POST',
                                'headers': {
                                        Accept: '*/*'
                                },
				generateError: false
			},
			// List Countries
			'phonebook.searchByCountries': {
				'apiRoot': monster.config.api.phonebook,
				'url': '?type=searchCountries',
				'verb': 'GET',
                                'headers': {
                                        Accept: '*/*'
                                },
				generateError: false
			}
		},

		subscribe: {
			'common.buyNumbers': 'buyNumbersRender',
			'common.buyNumbersGetAvailableCountries': 'buyNumbersGetAvailableCountries',
		},

		appFlags: {
			searchLimit: 15,
			isPhonebookConfigured: monster.config.api.hasOwnProperty('phonebook'),
			isSelectedNumbersEmpty: true
		},

		buyNumbersRender: function(params) {
			var self = this,
				params = params || {},
				args = {
					searchType: params.searchType || 'regular',
					singleSelect: params.singleSelect || false
				};

			self.assignedAccountId = params.accountId || self.accountId;

			self.buyNumbersGetAvailableCountries(function(countries) {
				args.availableCountries = countries;
				self.buyNumbersShowPopup(args, params.callbacks);
			});
		},

		buyNumbersGetAvailableCountries: function(callback) {
			var self = this;
			monster.request({
				resource: 'phonebook.searchByCountries',
				data: {
					accountId: self.assignedAccountId,
					apitoken: self.apitoken
				},
				success: function(data, status) {
					callback(data.data);
				},
				error: function(data, status) {
					toastr.error(self.i18n.active().buyNumbers.unavailableServiceAlert);
				}
			});
		},

		buyNumbersShowPopup: function(args, callbacks) {
			var self = this,
				searchType = args.searchType,
				availableCountries = args.availableCountries,
				template = $(monster.template(self, 'buyNumbers-layout', {
					isPhonebookConfigured: self.appFlags.isPhonebookConfigured
				}));

			args.popup = monster.ui.dialog(template, {
				title: self.i18n.active().buyNumbers.buyDialogTitle,
				width: '660px',
				position: ['center', 20]
			});

			$.extend(true, args, {
				container: template,
				displayedNumbers: [],
				selectedNumbers: [],
				isSearchFunctionEnabled: false
			});

			template.find('.start-hidden').hide();
			template.find('.regular-search').hide();
			template.find('.tollfree-search').hide();

                        flags.availableDropdown(template.find('#metadata_country'), {available: availableCountries, selected: self.i18n.active().buyNumbers.defaultCountry});
                        template.find('#metadata_country').chosenImage({ search_contains: true, width: '200px' });

                        flags.availableDropdown(template.find('#meta_country'), {available: availableCountries, selected: self.i18n.active().buyNumbers.defaultCountry});
                        template.find('#meta_country').chosenImage({ search_contains: true, width: '200px' });

			switch(searchType) {
				case 'tollfree':
					self.buyNumbersRenderTollfree(args);
					break;

				case 'regular':
				default:
					self.buyNumbersRenderRegular(args);
					break;
			};

			self.buyNumbersBindEvents(args, callbacks || {});
		},

		buyNumbersBindEvents: function(args, callbacks) {
			var self = this,
				container = args.container;
				searchResultDiv = container.find('#search_result_div'),
				resultDiv = searchResultDiv.find('.left-div'),
				purchaseNumbers = function() {
console.log(args);
					var numbers = self.buyNumbersSelectedNumbersToArray(args.selectedNumbers, args.selectedNumbers),
						processingDiv = container.find('#processing_purchase_div');
					
					processingDiv.show();
					processingDiv.find('i.fa-spinner').addClass('fa-spin');
					
					self.buyNumbersRequestActivateBlock({
						data: {
							accountId: self.assignedAccountId,
							data: {
								numbers: numbers
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
								var errMsg = self.i18n.active().buyNumbers.partialPurchaseFailure + ' ' + Object.keys(data).join(' ');
								toastr.error(errMsg);
							}
							args.popup.dialog('close');
							callbacks.hasOwnProperty('error') && callbacks.error();
						},
						cancel: function() {
							self.buyNumbersShowSearchResults(args);
							processingDiv.hide();
						}
					});
				};

			searchResultDiv.on('click', 'i.remove-number', function(ev) {
				ev.preventDefault();
				var $this = $(this),
					removedIndex = $this.data('index'),
					removedArrayIndex = $this.data('array_index');
					if (args.singleSelect) {
						$.each(container.find('.add-number'), function(idx, val) {
							$(this)
								.removeClass('disabled')
								.prop('disabled', false);
						});
						self.appFlags.isSelectedNumbersEmpty = true;
						container
							.find('#single_select_info')
								.removeClass('hidden');
					}
				args.selectedNumbers.splice(removedIndex,1);
				self.buyNumbersRefreshSelectedNumbersList(args);

				delete args.displayedNumbers[removedArrayIndex].selected;
				container.find('#'+removedArrayIndex+"_div").show();
			});

			searchResultDiv.on('click', 'button.add-number', function(ev) {
				ev.preventDefault();
				var addedIndex = $(this).data('array_index');
				if (args.singleSelect) {
					$.each(container.find('.add-number'), function(idx, val) {
						$(this)
							.addClass('disabled')
							.prop('disabled', true);
					});
					self.appFlags.isSelectedNumbersEmpty = false;
						container
							.find('#single_select_info')
								.addClass('hidden');
				}
				args.selectedNumbers.push(args.displayedNumbers[addedIndex]);
				self.buyNumbersRefreshSelectedNumbersList(args);

				args.displayedNumbers[addedIndex].selected = true;
				container.find('#'+addedIndex+"_div").hide("slide", { direction: "right" }, 300);
				if(resultDiv.children('.number-box').height() * resultDiv.children('.number-box:visible').length <= resultDiv.innerHeight()) {
					resultDiv.scroll();
				}
			});

			container.find('#buy_numbers_button').on('click', function(ev) {
				ev.preventDefault();
				var totalNumbers = self.buyNumbersGetTotalNumbers(args.selectedNumbers);

				if(totalNumbers > 0) {
					container.find('#search_top_div').hide();
					container.find('#search_result_div').hide();
					container.find('#check_numbers_div').show();

					self.buyNumbersToggleCheckingDiv(container, true);
					setTimeout(function() {
						self.buyNumbersToggleCheckingDiv(container, false);
						var unavailableNumbers = [];
						if(unavailableNumbers.length > 0) {
							container.find('#check_numbers_div .unavailable-div .unavailable-numbers')
									 .empty()
									 .append(monster.template(self, 'buyNumbers-unavailableNumbers', {numbers: unavailableNumbers}));
						} else {
							container.find('#check_numbers_div').hide();
							purchaseNumbers();
						}
					}, 1000);
				} else {
					toastr.error(self.i18n.active().buyNumbers.noSelectedNumAlert);
				}
			});

			container.find('#back_to_results_link').on('click', function(ev) {
				ev.preventDefault();
				self.buyNumbersShowSearchResults(args);
				container.find('#check_numbers_div').hide();
			});

			container.find('#continue_buy_button').on('click', function(ev) {
				ev.preventDefault();
				container.find('#check_numbers_div').hide();
				purchaseNumbers();
			});
		},

		buyNumbersRenderTollfree: function(args, callback) {
			var self = this,
				container = args.container,
				availableCountries = args.availableCountries,
				countryData = [];

			$.each(availableCountries, function(key, value) {
				if(value.toll_free && value.toll_free.length > 0) {
					key === "US" ? countryData.splice(0, 0, self.buyNumbersFormatCountryListElement(key,value)) : countryData.push(self.buyNumbersFormatCountryListElement(key,value));
				}
			});

			var tollfreePrefixes = availableCountries[self.i18n.active().buyNumbers.defaultCountry].toll_free,
				radioGroup = container.find('#tollfree_radio_group');

			radioGroup.empty()
			.append(monster.template(self, 'buyNumbers-tollfree', {tollfreePrefixes: tollfreePrefixes}));
			radioGroup.find('input:radio:first').prop('checked', true);
			container.find('.tollfree-search').show();

			self.buyNumbersBindTollfreeEvents(args);
		},

		buyNumbersBindTollfreeEvents: function(args) {
			var self = this,
				container = args.container,
				availableCountries = args.availableCountries,
				countrySelect = container.find('#meta_country').val(),
				searchResultDiv = container.find('#search_result_div'),
				resultDiv = searchResultDiv.find('.left-div'),
				performSearch = function(_offset, _limit, _callback) { /* To be implemented in search button click event */ },
				loadingNewNumbers = false,
				searchOffset = 0;

			container.find('#tollfree_search_button').on('click', function(ev) {
				ev.preventDefault();
				var tollfreePrefix = container.find('#tollfree_radio_group input[type="radio"]:checked').val();

				performSearch = function(_offset, _limit, _callback) {
					loadingNewNumbers = true;
					resultDiv.append(monster.template(self, 'buyNumbers-loadingNumbers', {}));
					resultDiv[0].scrollTop = resultDiv[0].scrollHeight;
					self.buyNumbersRequestSearchNumbers({
						data: {
							country: availableCountries[countryToll].prefix,
							pattern: tollfreePrefix.replace(/^0/,''),
							offset: _offset,
							limit: _limit
						},
						success: function(data) {
							if(data && data.length > 0) {
								$.each(data, function(key, value) {
									var num = value.number,
										prefix = "+" + availableCountries[countrySelect].prefix;
									if(num.indexOf(prefix) === 0) { num = num.substring(prefix.length); }
									args.displayedNumbers.push({
										array_index: args.displayedNumbers.length,
										number_value: num,
										formatted_value: self.buyNumbersFormatNumber(num, countrySelect)
									});
								});

								searchOffset += _limit;
							} else {
								args.isSearchFunctionEnabled = false;
							}

							_callback && _callback();
							loadingNewNumbers = false;
						},
						error: function() {
							toastr.error(self.i18n.active().buyNumbers.unavailableServiceAlert);
							_callback && _callback();
							loadingNewNumbers = false;
						}
					});
				};

				args.displayedNumbers = [];
				args.selectedNumbers = [];
				searchOffset = 0;
				args.isSearchFunctionEnabled = true;
				resultDiv.empty();
				performSearch(searchOffset, self.appFlags.searchLimit, function() {
					self.buyNumbersRefreshDisplayedNumbersList(args);
					self.buyNumbersRefreshSelectedNumbersList(args);
				});

				if(searchResultDiv.css('display') === 'none') {
					searchResultDiv.slideDown();
				}
			});

		},

		buyNumbersRenderRegular: function(args, callback) {
			var self = this,
				container = args.container,
				availableCountries = args.availableCountries,
				countryData = [];

			$.each(availableCountries, function(key, value) {
				if(value.local) {
					key === "US" ? countryData.splice(0, 0, self.buyNumbersFormatCountryListElement(key,value)) : countryData.push(self.buyNumbersFormatCountryListElement(key,value));
				}
			});

			container.find('.regular-search').show();

			self.buyNumbersBindRegularEvents(args);
		},

		buyNumbersBindRegularEvents: function(args) {
			var self = this,
				container = args.container,
				selectedCity,
				cityList = {},
				searchResultDiv = container.find('#search_result_div'),
				resultDiv = searchResultDiv.find('.left-div'),
				performSearch = function(_offset, _limit, _callback) { /* To be implemented in search button click event */ },
				loadingNewNumbers = false,
				availableCountries = args.availableCountries,
				searchOffset = 0;

			// Activating the autocomplete feature on the city input
			container.find("#city_input").autocomplete({
				source: function( request, response ) {
					container.find('#area_code_radio_div').empty().slideUp();
					selectedCity = undefined;
					if(!request.term.match(/^\d+/)) {
						self.buyNumbersRequestSearchNumbersByCity({
							data: {
								city: request.term
							},
							success: function(data) {
								if(data) {
									cityList = data;
									response(
										$.map( cityList, function(val, key) {
											return {
												label: key + ", " + val.state + " (" + (val.prefixes.length <= 2 ? val.prefixes.join(", ") : val.prefixes.slice(0,2).join(", ")+",...") + ")",
												value: key
											}
										})
										.sort(function(a,b) {
											return (a.value.toLowerCase() > b.value.toLowerCase());
										})
										.slice(0,10)
									);
								}
							}
						});
					}
				},
				minLength: 2,
				delay: 500,
				select: function( event, ui ) {
					var areaCodes = cityList[ui.item.value].prefixes.sort(),
						areaCodesDiv = container.find('#area_code_radio_div');
					selectedCity = ui.item.value;
					areaCodesDiv.empty()
							  .append(monster.template(self, 'buyNumbers-areaCodes', {areaCodes: areaCodes}))
							  .find('input:radio:first').prop('checked', true);
					areaCodes.length > 1 ? areaCodesDiv.slideDown() : areaCodesDiv.slideUp();
					event.stopPropagation();
				}
			});

			// Activating the 'change' action on the sequential number checkbox
			container.find('#seq_num_checkbox').change(function() {
				var seqNumInputSpan = container.find('#seq_num_input_span'),
					searchButton = container.find('#search_numbers_button');
				if(this.checked) {
					seqNumInputSpan.slideDown();
					searchButton.animate({marginTop:"46px"});
				} else {
					seqNumInputSpan.slideUp();
					searchButton.animate({marginTop:"0"});
				}
			});

			container.on('keydown', '#city_input, input[name="area_code_radio"], #seq_num_input, #seq_num_checkbox', function(e) {
				if(e.keyCode == 13) {
					container.find('#search_numbers_button').click();
					$(this).blur();
				}
			});

			container.find('#search_numbers_button').on('click', function(ev) {
				ev.preventDefault();

				var seqNumIntvalue = parseInt(container.find('#seq_num_input').val(),10) || 1,
					isSeqNumChecked = container.find('#seq_num_checkbox').prop('checked'),
					cityInput = container.find('#city_input').val(),
					countrySelect = container.find('#metadata_country').val();
					areacode = cityInput.match(/^\d+$/) ? cityInput : container.find('#area_code_radio_div input[type="radio"]:checked').val(),
					searchParams = (cityInput.match(/^\d*$/) ? self.i18n.active().buyNumbers.areaCode
								 + " " + cityInput : selectedCity + " ("+areacode+")")
								 + (isSeqNumChecked ? " " + monster.template(self, '!'+self.i18n.active().buyNumbers.seqNumParamLabel, { sequentialNumbers: seqNumIntvalue }) : "");

				if( isSeqNumChecked && !(seqNumIntvalue > 1) ) {
					toastr.error(self.i18n.active().buyNumbers.seqNumAlert);
				} else {
					if(isSeqNumChecked) { /***** Block Search *****/
						performSearch = function(_offset, _limit, _callback) {
							loadingNewNumbers = true;
							resultDiv.append(monster.template(self, 'buyNumbers-loadingNumbers', {}));
							resultDiv[0].scrollTop = resultDiv[0].scrollHeight;
							self.buyNumbersRequestSearchBlockOfNumbers({
								data: {
									country: availableCountries[countrySelect].prefix,
									pattern: "+" + availableCountries[countrySelect].prefix + (areacode) ? areacode.replace(/^0/,'') : '',
									size: seqNumIntvalue,
									offset: _offset,
									limit: _limit
								},
								success: function(data) {
									if(data && data.length > 0) {
										$.each(data, function(key, value) {
											var startNum = value.start_number,
												endNum = value.end_number,
												prefix = "+"+availableCountries[countrySelect].prefix;

											if(startNum.indexOf(prefix) === 0) { startNum = startNum.substring(prefix.length); }
											if(endNum.indexOf(prefix) === 0) { endNum = endNum.substring(prefix.length); }

											args.displayedNumbers.push({
												array_index: args.displayedNumbers.length,
												number_value: startNum + "_" + value.size,
												formatted_value: self.buyNumbersFormatNumber(startNum, countrySelect, endNum)
											});
										});

										searchOffset += _limit;
									} else {
										args.isSearchFunctionEnabled = false;
									}

									_callback && _callback();
									loadingNewNumbers = false;
								},
								error: function() {
									toastr.error(self.i18n.active().buyNumbers.unavailableServiceAlert);
									_callback && _callback();
									loadingNewNumbers = false;
								}
							});
						};
					} else { /***** Regular Search *****/
						performSearch = function(_offset, _limit, _callback) {
							loadingNewNumbers = true;
							resultDiv.append(monster.template(self, 'buyNumbers-loadingNumbers', {}));
							resultDiv[0].scrollTop = resultDiv[0].scrollHeight;
							self.buyNumbersRequestSearchNumbers({
								data: {
									country: availableCountries[countrySelect].prefix,
									pattern: areacode.replace(/^0/,''),
									offset: _offset,
									limit: _limit
								},
								success: function(data) {
									if(data && data.length > 0) {
										$.each(data, function(key, value) {
											var num = value.number,
											prefix = "+"+ availableCountries[countrySelect].prefix;

//											if(num.indexOf(prefix) === 0) { num = num.substring(prefix.length); }
											args.displayedNumbers.push({
												array_index: args.displayedNumbers.length,
												number_value: num,
												formatted_value: self.buyNumbersFormatNumber(num, countrySelect)
											});
										});

										searchOffset += _limit;
									} else {
										args.isSearchFunctionEnabled = false;
									}

									_callback && _callback();
									loadingNewNumbers = false;
								},
								error: function() {
									toastr.error(self.i18n.active().buyNumbers.unavailableServiceAlert);
									_callback && _callback();
									loadingNewNumbers = false;
								}
							});
						};
					}

					container.find('#search_parameters').html(searchParams);

					args.displayedNumbers = [];
					args.selectedNumbers = [];
					searchOffset = 0;
					args.isSearchFunctionEnabled = true;
					resultDiv.empty();
					performSearch(searchOffset, self.appFlags.searchLimit, function() {
						self.buyNumbersRefreshDisplayedNumbersList(args);
						self.buyNumbersRefreshSelectedNumbersList(args);
					});
					container.find('#search_top_div').slideUp(function() {
						searchResultDiv.slideDown();
					});
				}
			});

			container.find('#back_to_search').click(function(ev) {
				ev.preventDefault();

				searchResultDiv.find('.result-content-div .left-div').scrollTop(0);
				searchResultDiv.slideUp(function() {
					container.find('#search_top_div').slideDown();
				});
			});

		},

		buyNumbersFormatNumber: function(startNumber, countryCode, endNumber, addPrefix) {
			var self = this,
				number = startNumber.toString(),
				countryCode = countryCode || "US",
				endNumber = endNumber ? endNumber.toString() : number,
				result = number;

			switch(countryCode) {
				case "US":
					result = (addPrefix ? "+"+addPrefix+" " : "") + number.replace(/(\d{3})(\d{3})(\d{4})/,'($1) $2-$3');
					break;
				default:
					result = (addPrefix ? "+"+addPrefix : "") + number;
					break;
			}

			if(endNumber.length === number.length && endNumber !== number) {
				result += " "+self.i18n.active().buyNumbers.to+" " + endNumber.substr(endNumber.length - 4);
			}

			return result;
		},

		buyNumbersGetTotalNumbers: function(selectedNumbers) {
			var matched,
				result = 0;

			$.each(selectedNumbers, function(key, value) {
				matched = value.number_value.match(/\d+_(\d+)/);
				if(matched) { result += parseInt(matched[1], 10); }
				else { result += 1; }
			});

			return result;
		},

		buyNumbersFormatCountryListElement: function(k, v) {
			return {
				text: v.name,
				value: k,
				imageSrc: "css/assets/flags/32/"+k+".png"
			}
		},

		buyNumbersRefreshSelectedNumbersList: function(args) {
			var self = this,
				container = args.container,
				selectedNumbersList = monster.template(self, 'buyNumbers-selectedNumbers', {
					numbers: args.selectedNumbers,
					isSingleSelect: args.singleSelect
				}),
				totalNumbers = self.buyNumbersGetTotalNumbers(args.selectedNumbers);

			container.find('#search_result_div .right-div .center-div').empty().append(selectedNumbersList);
			container.find('#total_num_span').html(totalNumbers);

			// display the plural if there's more than 1 number added
			textAdded = (totalNumbers === 0 || totalNumbers === 1) ? self.i18n.active().buyNumbers.numberAddedSingle : self.i18n.active().buyNumbers.numberAddedPlural;
			container.find('.number-added').html(textAdded);
		},

		buyNumbersRefreshDisplayedNumbersList: function(args) {
			var self = this,
				container = args.container,
				searchResultsList = monster.template(self, 'buyNumbers-searchResults', { numbers: args.displayedNumbers }),
				resultDiv = container.find('#search_result_div .left-div');

			resultDiv.empty().append(searchResultsList);

			if (args.singleSelect) {
				if (!self.appFlags.isSelectedNumbersEmpty) {
					$.each(resultDiv.find('.add-number'), function(idx, val) {
						$(this)
							.addClass('disabled')
							.prop('disabled', true);
					});
				}
			}

			if(!args.isSearchFunctionEnabled && resultDiv[0].scrollHeight > resultDiv.height()) {
				resultDiv.children('.number-box.number-wrapper').last().css('border-bottom','none');
			}
		},

		buyNumbersShowSearchResults: function(args) {
			var self = this,
				container = args.container,
				searchResultDiv = container.find('#search_result_div'),
				searchType = args.searchType;

			if(searchType === 'tollfree') {
				container.find('#search_top_div').show();
			}
			searchResultDiv.show();

			self.buyNumbersRefreshDisplayedNumbersList({
				container: searchResultDiv,
				displayedNumbers: args.displayedNumbers,
				isSearchFunctionEnabled: args.isSearchFunctionEnabled
			});
			self.buyNumbersRefreshSelectedNumbersList({
				container: searchResultDiv,
				selectedNumbers: args.selectedNumbers
			});
		},

		buyNumbersToggleCheckingDiv: function(container, toggle) {
			var checkingDiv = container.find('#check_numbers_div .checking-div'),
				unavailableDiv = container.find('#check_numbers_div .unavailable-div');
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

		buyNumbersSelectedNumbersToArray: function(selectedNumbers, prefix) {
			var result = [];
			_.each(selectedNumbers, function(val) {
				var block = val.number_value.match(/([0-9]+)_([0-9]+)/),
					number = block ? block[1] : val.number_value;
				if(block) {
					for(i=0; i<parseInt(block[2]); i++) {
						result.push(number+i);
					}
				} else {
					result.push(number);
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
		buyNumbersInitAreaCodeMap: function(mapData) {
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
							'<p>' + self.i18n.active().buyNumbers.markerAreaCodes + this.title + ':</p/>' + 
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
		buyNumbersCoerceObjectToArray: function(structure) {
			return _.isArray(structure) ? structure : _.map(structure, function(v) { return v; });
		},

		/**
		 * Extract the area code of each prefix value for each city and remove
		 * duplicate occurences.
		 * @param  {Object} cities List of cities containing prefixes
		 * @return {Object}        Same list with duplicate area codes removed
		 */
		buyNumbersGetUniqueAreaCodes: function(cities) {
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
		buyNumbersRequestActivateBlock: function(args) {
			var self = this;

			self.callApi({
				resource: 'numbers.activateBlock',
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
				},
				onChargesCancelled: function () {
					args.cancel && args.cancel();
				}
			});
		},

		// Search Requests
		buyNumbersRequestSearchNumbers: function(args) {
			var self = this,
				settings = {
					resource: self.appFlags.isPhonebookConfigured ? 'phonebook.search' : 'numbers.search',
					data: args.data,
					success: function(data, status) {
						args.hasOwnProperty('success') && args.success(self.buyNumbersCoerceObjectToArray(data.data));
					},
					error: function(data, status) {
						args.hasOwnProperty('error') && args.error();
					}
				};

			if (self.appFlags.isPhonebookConfigured) {
				monster.request(settings);
			}
			else {
				self.callApi(settings);
			}
		},
		buyNumbersRequestSearchBlockOfNumbers: function(args) {
			var self = this,
				settings = {
					resource: self.appFlags.isPhonebookConfigured ? 'phonebook.searchBlocks' : 'numbers.searchBlocks',
					data: args.data,
					success: function(data, status) {
						args.hasOwnProperty('success') && args.success(data.data);
					},
					error: function(data, status) {
						args.hasOwnProperty('error') && args.error();
					}
				};

			if (self.appFlags.isPhonebookConfigured) {
				monster.request(settings);
			}
			else {
				self.callApi(settings);
			}
		},
		buyNumbersRequestSearchNumbersByCity: function(args) {
			var self = this;
			monster.request({
				resource: self.appFlags.isPhonebookConfigured ? 'phonebook.searchCity' : 'numbers.searchCity',
				data: args.data,
				success: function(data, status) {
					args.hasOwnProperty('success') && args.success(data.data);
				},
				error: function(data, status) {
					args.hasOwnProperty('error') && args.error();
				}
			});
		},
		buyNumbersRequestSearchAreaCodeByAddress: function(args) {
			var self = this;

			monster.request({
				resource: self.appFlags.isPhonebookConfigured ? 'phonebook.searchByAddress' : 'numbers.searchByAddress',
				data: args.data,
				success: function(data, status) {
					args.hasOwnProperty('success') && args.success($.extend(true, data.data, {
						locales: self.buyNumbersGetUniqueAreaCodes(data.data.locales)
					}));
				},
				error: function(data, status) {
					if (status.status === 404) {
						args.hasOwnProperty('error') && args.error();
					}
				}
			});
		},

		add_numbers: function(numbers_data, callback, numbers_bought) {
			var self = this,
				number_data,
				numbers_bought = numbers_bought || [];

			if(numbers_data.length > 0) {
				var phone_number = numbers_data[0].phone_number.match(/^\+?1?([2-9]\d{9})$/),
					error_function = function() {
						monster.ui.confirm('There was an error when trying to acquire ' + numbers_data[0].phone_number +
							', would you like to retry?',
							function() {
								self.add_numbers(numbers_data, callback, numbers_bought);
							},
							function() {
								self.add_numbers(numbers_data.slice(1), callback, numbers_bought);
							}
						);
					};

				if(phone_number[1]) {
					self.activate_number(phone_number[1],
						function(_data, status) {
							numbers_bought.push(_data.data.id);
							self.add_numbers(numbers_data.slice(1), callback, numbers_bought);
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
					callback(numbers_bought);
				}
			}
		},

		activate_number: function(phone_number, success, error) {
			var self = this;

			monster.request(false, 'buyNumbers.activateNumber', {
					account_id: monster.ui.apps['auth'].account_id,
					api_url: monster.ui.apps['auth'].api_url,
					phone_number: encodeURIComponent(phone_number),
					data: {},
					generateError: false
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
		}

	};

	return buyNumbers;
});
