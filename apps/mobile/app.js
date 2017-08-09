define(["require", "jquery", "underscore", "toastr", "monster"], function(e) {
    var t = e("jquery"),
        n = e("underscore"),
        r = e("toastr"),
        i = e("monster"),
        s = {
            name: "mobile",
            css: ["app"],
            i18n: {
                "en-US": { customCss: !1 },
                "dk-DK": { customCss: !1 },
                "de-DE": { customCss: !1 },
                "es-ES": { customCss: !1 },
                "fr-FR": { customCss: !1 },
                "it-IT": { customCss: !1 },
                "ru-RU": { customCss: !1 },
                "pt-PT": { customCss: !1 },
                "ro-RO": { customCss: !1 },
                "nl-NL": { customCss: !1 },
                "zh-CN": { customCss: !1 }
            },
            requests: {
                "top.devices.get": {
                    apiRoot: i.config.api.top,
                    url: "accounts/{accountId}/devices/{mdn}",
                    verb: "GET"
                },
                "top.devices.update": {
                    apiRoot: i.config.api.top,
                    url: "accounts/{accountId}/devices/{mdn}",
                    verb: "PATCH"
                },
                "top.devices.list": {
                    apiRoot: i.config.api.top,
                    url: "accounts/{accountId}/devices",
                    verb: "GET"
                },
                "top.devices.validate": {
                    apiRoot: i.config.api.top,
                    url: "accounts/{accountId}/device/{esn}/validate",
                    verb: "GET"
                },
                "top.devices.activate": {
                    apiRoot: i.config.api.top,
                    url: "accounts/{accountId}/device/{esn}/activate",
                    verb: "POST"
                },
                "top.devices.deactivate": {
                    apiRoot: i.config.api.top,
                    url: "accounts/{accountId}/device/{esn}/deactivate",
                    verb: "POST"
                },
                "top.coverage.check": {
                    apiRoot: i.config.api.top,
                    url: "accounts/{accountId}/coverage/{zipCode}",
                    verb: "GET"
                },
                "google.geocode.address": {
                    apiRoot: "http://maps.googleapis.com/",
                    url: "/maps/api/geocode/json?components=country:{country}|postal_code:{zipCode}",
                    verb: "GET",
                    removeHeaders: ["X-Auth-Token", "Content-Type"]
                }
            },
            appFlags: {
                isActivating: !1
            },
            subscribe: {},
            load: function(e) {
                var t = this;
                t.initApp(function() {
                    e && e(t)
                })
            },
            initApp: function(e) {
                var t = this;
                i.pub("auth.initApp", {
                    app: t,
                    callback: e
                })
            },
            render: function(e) {
                var t = this;
                i.ui.generateAppLayout(t, {
                    appName: t.i18n.active().mobileApp.appName,
                    menus: [{
                        tabs: [{
                            text: t.i18n.active().mobileApp.menus.devicesList,
                            callback: t.renderDevicesList,
                            onClick: t.customMenuClickEvents.checkIfExitingWizard
                        }, {
                            text: t.i18n.active().mobileApp.menus.activateDevice,
                            callback: t.renderEsnCheck
                        }]
                    }, {
                        "float": "right",
                        tabs: [{
                            text: t.i18n.active().mobileApp.menus.provisioning,
                            callback: t.renderProvisioningModelsListing,
                            onClick: t.customMenuClickEvents.checkIfExitingWizard
                        }, {
                            text: t.i18n.active().mobileApp.menus.checkCoverage,
                            callback: t.renderCheckCoverage,
                            onClick: t.customMenuClickEvents.checkIfExitingWizard
                        }]
                    }]
                })
            },
            customMenuClickEvents: {
                checkIfExitingWizard: function(e) {
                    var t = this;
                    t.appFlags.isActivating ? i.ui.confirm(t.i18n.active().mobileApp.confirmPopup.leavingActivation, function() {
                        t.appFlags.isActivating = !1, e.callback()
                    }) : e.callback()
                }
            },
            renderDevicesList: function(e) {
                var r = this,
                    s = e.parent,
                    o = e.container;
                r.activateTab(e, 0), r.requestTopListDevices({
                    success: function(s) {
                        n.isEmpty(s) ? r.renderEmptyDevicesList(e) : o.fadeOut(function() {
                            var n = {
                                    devices: s
                                },
                                o = i.template(r, "devicesList", n);
                            t(this).empty().append(o).fadeIn(), r.bindDevicesListEvents(t.extend(!0, e, {
                                data: {
                                    devices: s
                                }
                            }))
                        })
                    },
                    error: function() {
                        r.renderEmptyDevicesList(e)
                    }
                })
            },
            renderEmptyDevicesList: function(e) {
                var n = this,
                    r = e.container,
                    s = i.template(n, "devicesList-empty");
                r.fadeOut(function() {
                    t(this).empty().append(s).fadeIn(), n.bindEmptyDevicesListEvents(e)
                })
            },
            renderDeviceInfo: function(e) {
                var n = this;
                n.renderLoading(e, {
                    title: n.i18n.active().mobileApp.loadingTitles.titles.searchingDevice,
                    callback: function() {
                        n.requestTopGetDevice({
                            data: {
                                mdn: e.data.mdn
                            },
                            success: function(r) {
                                var s = e.container,
                                    o = i.template(n, "deviceInfo", r);
                                s.fadeOut(function() {
                                    t(this).empty().append(o).fadeIn(), n.bindDeviceInfoEvents(t.extend(!0, e, {
                                        data: {
                                            deviceInfo: r
                                        }
                                    }))
                                })
                            },
                            error: function() {
                                n.renderDevicesList(e)
                            }
                        })
                    }
                })
            },
            renderEsnCheck: function(e) {
                var n = this,
                    r = e.container,
                    s = i.template(n, "activation-esnCheck");
                n.activateTab(e, 1), r.fadeOut(function() {
                    t(this).empty().append(s).fadeIn(function() {
                        r.find("#esn").focus()
                    }), n.bindEsnCheckEvents(e)
                })
            },
            renderDeviceValidation: function(e) {
                var n = this;
                n.renderLoading(e, {
                    title: n.i18n.active().mobileApp.loadingTitles.titles.validatingDevice,
                    callback: function() {
                        n.requestTopValidateDevice({
                            data: {
                                esn: e.data.esn
                            },
                            success: function(r) {
                                var s = e.container,
                                    o = {
                                        isInUse: !r.hasOwnProperty("error"),
                                        isValid: r.success
                                    },
                                    u = i.template(n, "activation-deviceValidation", o);
                                e.data.isSimRequired = r.sim_required, s.fadeOut(function() {
                                    t(this).empty().append(u).fadeIn(), n.bindDeviceValidationEvents(e)
                                })
                            },
                            error: function() {
                                n.renderEsnCheck(e)
                            }
                        })
                    }
                })
            },
            renderCheckCoverage: function(e) {
                var n = this,
                    r = e.container,
                    s = {
                        isActivating: n.appFlags.isActivating
                    },
                    o = i.template(n, "coverage-checkZipCode", s);
                r.fadeOut(function() {
                    t(this).empty().append(o).fadeIn(function() {
                        r.find("#zip_code").focus()
                    }), n.bindCheckCoverageEvents(e)
                })
            },
            renderCoverageInfo: function(e) {
                var n = this;
                n.renderLoading(e, {
                    title: n.i18n.active().mobileApp.loadingTitles.titles.checkingCoverage,
                    callback: function() {
                        n.requestCheckCoverage({
                            data: {
                                zipCode: e.data.zipCode
                            },
                            success: function(r) {
                                var s = e.container,
                                    o = {
                                        isActivating: n.appFlags.isActivating,
                                        coverage: r
                                    },
                                    u = i.template(n, "coverage-info", o);
                                s.fadeOut(function() {
                                    t(this).empty().append(u).fadeIn(), n.bindCoverageInfoEvents(e)
                                })
                            },
                            error: function() {
                                n.renderCheckCoverage(e)
                            }
                        })
                    }
                })
            },
            renderDeviceActivation: function(e) {
                var n = this;
                i.parallel({
                    mainUserCallflows: function(e) {
                        n.requestListCallflows({
                            data: {
                                filters: {
                                    filter_type: "mainUserCallflow"
                                }
                            },
                            success: function(t) {
                                e(null, t)
                            }
                        })
                    },
                    users: function(e) {
                        n.requestListUsers({
                            success: function(t) {
                                e(null, t)
                            }
                        })
                    },
                    voicemailBoxes: function(e) {
                        n.requestListVoicemailBoxes({
                            success: function(t) {
                                e(null, t)
                            }
                        })
                    }
                }, function(r, s) {
                    var o = e.container,
                        u = {
                            isSimRequired: e.data.isSimRequired,
                            zipCode: e.hasOwnProperty("data") ? e.data.zipCode : undefined,
                            currentUserId: n.userId,
                            users: s.users,
                            voicemailBoxes: s.voicemailBoxes
                        },
                        a = i.template(n, "activation-deviceActivation", u);
                    o.fadeOut(function() {
                        t(this).empty().append(a).fadeIn(function() {
                            var e = o.find("#zip_code"),
                                t = o.find("#device_name");
                            (e.val() ? t : e).focus()
                        }), n.bindDeviceActivationEvents(t.extend(!0, e, {
                            data: s
                        }))
                    })
                })
            },
            renderActivationSuccess: function(e) {
                var n = this;
                n.renderLoading(e, {
                    title: n.i18n.active().mobileApp.loadingTitles.titles.activatingDevice,
                    text: n.i18n.active().mobileApp.loadingTitles.texts.activatingDevice,
                    callback: function() {
                        n.activateDeviceHelper(t.extend(!0, e, {
                            success: function() {
                                var r = e.container,
                                    s = i.template(n, "activation-success", e.data.newDevice);
                                r.fadeOut(function() {
                                    t(this).empty().append(s).fadeIn(), n.bindActivationSuccessEvents(e)
                                })
                            },
                            error: function() {
                                n.renderDeviceActivation(e)
                            }
                        }))
                    }
                })
            },
            renderProvisioningModelsListing: function(e) {
                var n = this,
                    r = e.container,
                    s = i.template(n, "provisioning-modelsListing");
                r.fadeOut(function() {
                    t(this).empty().append(s).fadeIn(), n.bindProvisioningModelsListing(e)
                })
            },
            renderProvisioningModelInstructions: function(e) {
                var n = this,
                    r = e.container,
                    s = {
                        comingFromActivationSuccess: e.data.comingFromActivationSuccess,
                        model: n.i18n.active().mobileApp.provisioning.categories[e.data.modelType]
                    },
                    o = i.template(n, "provisioning-modelInstructions", s);
                r.fadeOut(function() {
                    t(this).empty().append(o).fadeIn(), n.bindProvisioningModelInstructions(e)
                })
            },
            bindDevicesListEvents: function(e) {
                var n = this,
                    r = e.container;
                r.find(".activate-device").on("click", function(t) {
                    t.preventDefault(), n.renderEsnCheck(e)
                }), r.find(".edit-device").on("click", function(r) {
                    r.preventDefault();
                    var i = t(this),
                        s = i.parents("tr").data("mdn");
                    n.renderDeviceInfo(t.extend(!0, e, {
                        data: {
                            mdn: s
                        }
                    }))
                }), r.find(".cancel-device").on("click", function(s) {
                    s.preventDefault();
                    var o = t(this),
                        u = o.parents("tr").data("mdn"),
                        a = o.parents("tr").data("esn");
                    i.ui.confirm(n.i18n.active().mobileApp.confirmPopup.deleteDevice.text, function() {
                        n.desactivateDeviceHelper({
                            data: {
                                mdn: u,
                                esn: a
                            },
                            success: function() {
                                r.find("tbody").children().length === 1 ? n.renderEmptyDevicesList(e) : o.parents("tr").fadeOut(function() {
                                    t(this).remove()
                                })
                            }
                        })
                    }, function() {}, {
                        title: n.i18n.active().mobileApp.confirmPopup.deleteDevice.title + e.data.devices[a].device_name,
                        confirmButtonText: n.i18n.active().mobileApp.confirmPopup.deleteDevice.confirmButton,
                        confirmButtonClass: "monster-button-danger"
                    })
                })
            },
            bindEmptyDevicesListEvents: function(e) {
                var t = this,
                    n = e.container;
                n.find(".action-button").on("click", function(n) {
                    n.preventDefault(), t.renderEsnCheck(e)
                })
            },
            bindDeviceInfoEvents: function(e) {
                var n = this,
                    r = e.container;
                r.find(".edit").on("click", function(e) {
                    e.preventDefault();
                    var n = t(this),
                        r = n.siblings(".device-name-text"),
                        i = n.siblings(".device-name-input");
                    r.fadeOut(function() {
                        i.fadeIn(function() {
                            i.focus()
                        })
                    }), t(this).fadeOut()
                }), r.find(".device-name-input").on("keypress blur", function(e) {
                    if (!e.hasOwnProperty("keyCode") || e.keyCode === 13) {
                        var n = t(this),
                            r = n.siblings(".device-name-text"),
                            i = n.siblings(".edit");
                        n.fadeOut(function() {
                            i.fadeIn(), r.fadeIn()
                        }), r.text(n.val())
                    }
                }), r.find(".back").on("click", function(t) {
                    t.preventDefault(), n.renderDevicesList(e)
                }), r.find(".update").on("click", function(t) {
                    t.preventDefault();
                    var i = r.find(".device-name-input").val();
                    e.data.deviceInfo.device_name !== i ? n.requestTopUpdateDevice({
                        data: {
                            mdn: e.data.mdn,
                            newDeviceName: i
                        },
                        success: function() {
                            n.renderDevicesList(e)
                        },
                        error: function() {
                            n.renderDevicesList(e)
                        }
                    }) : n.renderDevicesList(e)
                })
            },
            bindEsnCheckEvents: function(e) {
                var n = this,
                    r = e.container;
                r.find(".action-button").on("click", function(s) {
                    s.preventDefault();
                    var o = r.find("#esn_check_form");
                    i.ui.validate(o, {
                        rules: {
                            esn: {
                                required: !0,
                                digits: !0
                            }
                        }
                    }), i.ui.valid(o) && n.renderDeviceValidation(t.extend(!0, e, {
                        data: {
                            esn: i.ui.getFormData("esn_check_form").esn
                        }
                    }))
                })
            },
            bindDeviceValidationEvents: function(e) {
                var t = this,
                    n = e.container;
                n.find(".cancel").on("click", function(n) {
                    n.preventDefault(), t.appFlags.isActivating = !1, t.renderEsnCheck(e)
                }), n.find(".check-coverage").on("click", function(n) {
                    n.preventDefault(), t.renderCheckCoverage(e)
                }), n.find(".activate-device").on("click", function(n) {
                    n.preventDefault(), t.renderDeviceActivation(e)
                })
            },
            bindCheckCoverageEvents: function(e) {
                var n = this,
                    r = e.container;
                r.find(".check-coverage").on("click", function(s) {
                    s.preventDefault();
                    var o = r.find("#check_coverage_form");
                    i.ui.validate(o, {
                        rules: {
                            zip_code: {
                                required: !0,
                                digits: !0,
                                minlength: 5,
                                maxlength: 5
                            }
                        }
                    }), i.ui.valid(o) && n.renderCoverageInfo(t.extend(!0, e, {
                        data: {
                            zipCode: i.ui.getFormData("check_coverage_form").zip_code
                        }
                    }))
                })
            },
            bindCoverageInfoEvents: function(e) {
                var t = this,
                    n = e.container;
                n.find(".check-zipCode").on("click", function(n) {
                    n.preventDefault(), t.renderCheckCoverage(e)
                }), n.find(".activate").on("click", function() {
                    event.preventDefault(), t.renderDeviceActivation(e)
                })
            },
            bindDeviceActivationEvents: function(e) {
                var r = this,
                    s = e.container,
                    o = n.map(e.data.mainUserCallflows, function(e) {
                        return e.owner_id
                    });
                s.find("#user_id").chosen({
                    search_contains: !0,
                    width: "220px"
                }), s.find("#is_smartpbx_user").on("change", function(e) {
                    var t = s.find("#user_id_container"),
                        n = s.find("#voicemail_box_container");
                    e.target.checked ? (o.indexOf(s.find("#user_id").val()) < 0 ? n.slideDown() : n.slideUp(), t.slideDown()) : (s.find("#has_voicemail_box").is(":checked") && s.find("#has_voicemail_box").click(), s.find("#user_id").val(r.userId).trigger("chosen:updated"), n.slideUp(), t.slideUp())
                }), s.find("#user_id").on("change", function(t) {
                    var r = s.find("#voicemail_box_container");
                    if (o.indexOf(t.target.value) < 0) {
                        var i = n.find(e.data.voicemailBoxes, function(e, t) {
                            return e.owner_id === s.find("#user_id").val()
                        });
                        i !== undefined && s.find("#voicemail_box_id").val(i.id).trigger("chosen:update"), r.slideDown()
                    } else s.find("#has_voicemail_box").is(":checked") && s.find("#has_voicemail_box").click(), r.slideUp()
                }), s.find("#has_voicemail_box").on("change", function(t) {
                    var r = s.find("#voicemail_box_id_container");
                    if (t.target.checked) {
                        var i = n.find(e.data.voicemailBoxes, function(e, t) {
                            return e.owner_id === s.find("#user_id").val()
                        });
                        i !== undefined && s.find("#voicemail_box_id").val(i.id).trigger("chosen:updated"), r.slideDown()
                    } else r.slideUp()
                }), s.find(".activate-device").on("click", function(n) {
                    n.preventDefault();
                    var o = s.find("#activation_form");
                    i.ui.validate(o, {
                        rules: {
                            "device.sim": {
                                required: !0,
                                digits: !0
                            },
                            "device.zip_code": {
                                required: !0,
                                digits: !0,
                                minlength: 3,
                                maxlength: 5
                            },
                            "device.device_name": {
                                required: !0,
                                minlength: 3,
                                maxlength: 128
                            }
                        }
                    });
                    if (i.ui.valid(o)) {
                        var u = i.ui.getFormData("activation_form"),
                            a = {
                                newDevice: u.device
                            };
                        u.is_smartpbx_user && (a.userId = u.user_id), u.has_voicemail_box && (a.voicemail_box_id = u.voicemail_box_id), r.renderActivationSuccess(t.extend(!0, e, {
                            data: a
                        }))
                    }
                })
            },
            bindActivationSuccessEvents: function(e) {
                var n = this,
                    r = e.container;
                r.find(".provision-device").on("click", function(r) {
                    r.preventDefault(), n.renderProvisioningModelsListing(t.extend(!0, e, {
                        data: {
                            comingFromActivationSuccess: !0
                        }
                    }))
                })
            },
            bindProvisioningModelsListing: function(e) {
                var n = this,
                    r = e.container;
                r.find(".model-type").on("click", function(r) {
                    r.preventDefault();
                    var i = t(this),
                        s = i.data("model");
                    n.renderProvisioningModelInstructions(t.extend(!0, e, {
                        data: {
                            modelType: s
                        }
                    }))
                })
            },
            bindProvisioningModelInstructions: function(e) {
                var t = this,
                    n = e.container;
                n.find(".device-categories").on("click", function(n) {
                    n.preventDefault(), t.renderProvisioningModelsListing(e)
                }), n.find(".done").on("click", function(n) {
                    n.preventDefault(), t.appFlags.isActivating = !1, t.renderDevicesList(e)
                })
            },
            activateTab: function(e, n) {
                var r = this,
                    i = e.parent,
                    s = t(i.find(".navbar-menu-item-link")[n]);
                s.hasClass("active") || (i.find(".navbar-menu-item-link").removeClass("active"), s.addClass("active"))
            },
            renderLoading: function(e, n) {
                var r = this,
                    s = e.container,
                    o = i.template(r, "loading-singleStep", n);
                s.fadeOut(function() {
                    t(this).empty().append(o).fadeIn()
                }), n.callback()
            },
            activateDeviceHelper: function(e) {
                var r = this;
                r.requestTopActivateDevice({
                    data: {
                        esn: e.data.esn,
                        newDevice: e.data.newDevice
                    },
                    success: function(i) {
                        r.requestKazooCreateDevice({
                            data: {
                                deviceData: i,
                                userId: e.data.userId
                            },
                            success: function(s) {
                                var o = {
                                    mdn: i.mdn,
                                    userId: e.data.userId
                                };
                                if (e.data.userId === undefined) r.requestCreateCallflow({
                                    data: t.extend(!0, o, {
                                        deviceId: s.id
                                    }),
                                    success: function() {
                                        e.hasOwnProperty("success") && e.success(t.extend(!0, e, {
                                            data: {
                                                newDevice: i
                                            }
                                        }))
                                    }
                                });
                                else {
                                    var u = n.find(e.data.mainUserCallflows, function(t, n) {
                                        return t.owner_id === e.data.userId
                                    });
                                    if (u === undefined) {
                                        var a = {
                                            userId: e.data.userId,
                                            deviceId: s.id
                                        };
                                        e.data.hasOwnProperty("voicemail_box_id") && (a.voicemailBoxId = e.data.voicemail_box_id), r.requestCreateCallflow({
                                            data: t.extend(!0, o, a),
                                            success: function() {
                                                e.hasOwnProperty("success") && e.success(t.extend(!0, e, {
                                                    data: {
                                                        newDevice: i
                                                    }
                                                }))
                                            }
                                        })
                                    } else r.requestCreateCallflow({
                                        data: t.extend(!0, o, {
                                            userId: e.data.userId,
                                            callflowId: u.id
                                        }),
                                        success: function() {
                                            e.hasOwnProperty("success") && e.success(t.extend(!0, e, {
                                                data: {
                                                    newDevice: i
                                                }
                                            }))
                                        }
                                    })
                                }
                            }
                        })
                    },
                    error: function() {
                        r.renderDeviceActivation(e)
                    }
                })
            },
            desactivateDeviceHelper: function(e) {
                var t = this;
                t.requestTopDesactivateDevice({
                    data: {
                        esn: e.data.esn
                    },
                    success: function() {
                        i.parallel({
                            deleteMobileCallflows: function(r) {
                                t.requestSearchCallflowsByNumbers({
                                    data: {
                                        mdn: e.data.mdn
                                    },
                                    success: function(i) {
                                        n.isEmpty(i) ? r(null, {}) : n.each(i, function(n, i) {
                                            n.numbers.length > 1 ? t.requestGetCallflow({
                                                data: {
                                                    callflowId: n.id
                                                },
                                                success: function(n) {
                                                    delete n.name, delete n.type, n.numbers.splice(n.numbers.indexOf("+1" + e.data.mdn), 1), t.requestUpdateCallflow({
                                                        data: {
                                                            callflowData: n
                                                        },
                                                        success: function() {
                                                            r(null, {})
                                                        }
                                                    })
                                                }
                                            }) : t.requestDeleteCallflow({
                                                data: {
                                                    callflowId: n.id
                                                },
                                                success: function() {
                                                    r(null, {})
                                                }
                                            })
                                        })
                                    }
                                })
                            },
                            deleteKazooDevice: function(r) {
                                t.requestKazooListDevices({
                                    data: {
                                        filters: {
                                            "filter_mobile.mdn": e.data.mdn
                                        }
                                    },
                                    success: function(e) {
                                        n.isEmpty(e) ? r(null, {}) : t.requestKazooDeleteDevice({
                                            data: {
                                                deviceId: e[0].id
                                            },
                                            success: function() {
                                                r(null, {})
                                            }
                                        })
                                    }
                                })
                            }
                        }, function(t, n) {
                            e.hasOwnProperty("success") && e.success()
                        })
                    }
                })
            },
            requestTopGetDevice: function(e) {
                var t = this;
                i.request({
                    resource: "top.devices.get",
                    data: {
                        accountId: t.accountId,
                        mdn: e.data.mdn
                    },
                    success: function(t, n) {
                        e.hasOwnProperty("success") && e.success(t.device)
                    },
                    error: function(t, n) {
                        e.hasOwnProperty("error") && e.error()
                    }
                })
            },
            requestTopUpdateDevice: function(e) {
                var t = this;
                i.request({
                    resource: "top.devices.update",
                    data: {
                        accountId: t.accountId,
                        mdn: e.data.mdn,
                        data: {
                            device_name: e.data.newDeviceName
                        }
                    },
                    success: function(t, n) {
                        e.hasOwnProperty("success") && e.success()
                    },
                    error: function(t, n) {
                        e.hasOwnProperty("error") && e.error()
                    }
                })
            },
            requestTopDesactivateDevice: function(e) {
                var t = this;
                i.request({
                    resource: "top.devices.deactivate",
                    data: {
                        accountId: t.accountId,
                        esn: e.data.esn
                    },
                    success: function(t, n) {
                        e.hasOwnProperty("success") && e.success()
                    },
                    error: function(t, n) {
                        e.hasOwnProperty("error") && e.error()
                    }
                })
            },
            requestTopListDevices: function(e) {
                var t = this;
                i.request({
                    resource: "top.devices.list",
                    data: {
                        accountId: t.accountId
                    },
                    success: function(t, r) {
                        e.hasOwnProperty("success") && e.success(n.indexBy(t.devices, "esn"))
                    },
                    error: function(t, n) {
                        e.hasOwnProperty("error") && e.error()
                    }
                })
            },
            requestTopValidateDevice: function(e) {
                var t = this;
                i.request({
                    resource: "top.devices.validate",
                    data: {
                        accountId: t.accountId,
                        esn: e.data.esn
                    },
                    success: function(n, r) {
                        t.appFlags.isActivating = n.success, e.hasOwnProperty("success") && e.success(n)
                    },
                    error: function(t, n) {
                        e.hasOwnProperty("error") && e.error()
                    }
                })
            },
            requestTopActivateDevice: function(e) {
                var n = this;
                i.request({
                    resource: "top.devices.activate",
                    data: {
                        accountId: n.accountId,
                        esn: e.data.esn,
                        data: t.extend(!0, e.data.newDevice, {
                            realm: i.apps.auth.currentAccount.realm,
                            username: "user_" + i.util.randomString(6),
                            password: i.util.randomString(12)
                        })
                    },
                    success: function(t, r) {
                        t.success ? (n.appFlags.isActivating = !1, e.hasOwnProperty("success") && e.success(t)) : e.hasOwnProperty("error") && e.error()
                    },
                    error: function(t, n) {
                        e.hasOwnProperty("error") && e.error()
                    }
                })
            },
            requestKazooCreateDevice: function(e) {
                var t = this;
                t.callApi({
                    resource: "device.create",
                    data: {
                        accountId: t.accountId,
                        data: {
                            call_restriction: {
                                tollfree_us: {
                                    action: "inherit"
                                },
                                toll_us: {
                                    action: "inherit"
                                },
                                emergency: {
                                    action: "inherit"
                                },
                                caribbean: {
                                    action: "inherit"
                                },
                                did_us: {
                                    action: "inherit"
                                },
                                international: {
                                    action: "inherit"
                                },
                                unknown: {
                                    action: "inherit"
                                }
                            },
                            caller_id: {},
                            contact_list: {},
                            device_type: "mobile",
                            dial_plan: {},
                            enabled: !0,
                            exclude_from_queues: !1,
                            ignore_completed_elsewhere: !1,
                            media: {
                                audio: {
                                    codecs: ["PCMU", "PCMA"]
                                },
                                encryption: {
                                    enforce_security: !1,
                                    methods: []
                                },
                                video: {
                                    codecs: []
                                }
                            },
                            mobile: {
                                esn: e.data.deviceData.device.esn,
                                mdn: e.data.deviceData.mdn
                            },
                            music_on_hold: {},
                            mwi_unsolicitated_updates: !0,
                            name: e.data.deviceData.name,
                            owner_id: e.data.userId,
                            suppress_unregister_notifications: !1,
                            register_overwrite_notify: !1,
                            ringtones: {},
                            sip: {
                                expire_seconds: 360,
                                invite_format: "username",
                                method: "password",
                                password: e.data.deviceData.voice.kazoo.routing.password,
                                registration_expiration: 300,
                                username: e.data.deviceData.voice.kazoo.routing.username
                            }
                        }
                    },
                    success: function(t, n) {
                        e.hasOwnProperty("success") && e.success(t.data)
                    },
                    error: function(t, n) {
                        e.hasOwnProperty("error") && e.error()
                    }
                })
            },
            requestKazooDeleteDevice: function(e) {
                var t = this;
                t.callApi({
                    resource: "device.delete",
                    data: {
                        accountId: t.accountId,
                        deviceId: e.data.deviceId
                    },
                    success: function(t, n) {
                        e.hasOwnProperty("success") && e.success()
                    },
                    error: function(t, n) {
                        e.hasOwnProperty("error") && e.error()
                    }
                })
            },
            requestKazooListDevices: function(e) {
                var n = this;
                n.callApi({
                    resource: "device.list",
                    data: t.extend(!0, e.data, {
                        accountId: n.accountId
                    }),
                    success: function(t, n) {
                        e.hasOwnProperty("success") && e.success(t.data)
                    },
                    error: function(t, n) {
                        e.hasOwnProperty("error") && e.error()
                    }
                })
            },
            requestGetCallflow: function(e) {
                var t = this;
                t.callApi({
                    resource: "callflow.get",
                    data: {
                        accountId: t.accountId,
                        callflowId: e.data.callflowId
                    },
                    success: function(t, n) {
                        e.hasOwnProperty("success") && e.success(t.data)
                    },
                    error: function(t, n) {
                        e.hasOwnProperty("error") && e.error()
                    }
                })
            },
            requestCreateCallflow: function(e) {
                var n = this,
                    r = {
                        contact_list: {
                            exclude: !1
                        },
                        numbers: [e.data.mdn],
                        name: n.i18n.active().mobileApp.misc.callflowName.replace("{{variable}}", i.util.formatPhoneNumber(e.data.mdn)),
                        type: "mobile",
                        flow: t.extend(!0, {
                            children: {}
                        }, e.data.flow)
                    };
                e.data.hasOwnProperty("userId") && (r.owner_id = e.data.userId), e.data.hasOwnProperty("deviceId") ? (t.extend(!0, r, {
                    flow: {
                        module: "device",
                        data: {
                            can_call_self: !1,
                            id: e.data.deviceId,
                            timeout: 20
                        }
                    }
                }), e.data.hasOwnProperty("voicemailBoxId") && t.extend(!0, r, {
                    flow: {
                        children: {
                            _: {
                                children: {},
                                data: {
                                    id: e.data.voicemailBoxId
                                },
                                module: "voicemail"
                            }
                        }
                    }
                })) : e.data.hasOwnProperty("callflowId") && t.extend(!0, r, {
                    flow: {
                        module: "callflow",
                        data: {
                            id: e.data.callflowId
                        }
                    }
                }), n.callApi({
                    resource: "callflow.create",
                    data: {
                        accountId: n.accountId,
                        data: r
                    },
                    success: function(t, n) {
                        e.hasOwnProperty("success") && e.success()
                    },
                    error: function(t, n) {
                        e.hasOwnProperty("error") && e.error()
                    }
                })
            },
            requestUpdateCallflow: function(e) {
                var t = this;
                t.callApi({
                    resource: "callflow.update",
                    data: {
                        accountId: t.accountId,
                        callflowId: e.data.callflowData.id,
                        data: e.data.callflowData
                    },
                    success: function(t, n) {
                        e.hasOwnProperty("success") && e.success()
                    },
                    error: function(t, n) {
                        e.hasOwnProperty("error") && e.error()
                    }
                })
            },
            requestDeleteCallflow: function(e) {
                var t = this;
                t.callApi({
                    resource: "callflow.delete",
                    data: {
                        accountId: t.accountId,
                        callflowId: e.data.callflowId
                    },
                    success: function(t, n) {
                        e.hasOwnProperty("success") && e.success()
                    },
                    error: function(t, n) {
                        e.hasOwnProperty("error") && e.error()
                    }
                })
            },
            requestListCallflows: function(e) {
                var n = this;
                n.callApi({
                    resource: "callflow.list",
                    data: t.extend(!0, e.data, {
                        accountId: n.accountId
                    }),
                    success: function(t, n) {
                        e.hasOwnProperty("success") && e.success(t.data)
                    },
                    error: function(t, n) {
                        e.hasOwnProperty("error") && e.error()
                    }
                })
            },
            requestSearchCallflowsByNumbers: function(e) {
                var t = this;
                t.callApi({
                    resource: "callflow.searchByNumber",
                    data: {
                        accountId: t.accountId,
                        value: encodeURIComponent("+1" + e.data.mdn)
                    },
                    success: function(t, n) {
                        e.hasOwnProperty("success") && e.success(t.data)
                    },
                    error: function(t, n) {
                        e.hasOwnProperty("error") && e.error()
                    }
                })
            },
            requestListUsers: function(e) {
                var t = this;
                t.callApi({
                    resource: "user.list",
                    data: {
                        accountId: t.accountId
                    },
                    success: function(t, n) {
                        e.hasOwnProperty("success") && e.success(t.data)
                    },
                    error: function(t, n) {
                        e.hasOwnProperty("error") && e.error()
                    }
                })
            },
            requestListVoicemailBoxes: function(e) {
                var t = this;
                t.callApi({
                    resource: "voicemail.list",
                    data: {
                        accountId: t.accountId
                    },
                    success: function(t, n) {
                        e.hasOwnProperty("success") && e.success(t.data)
                    },
                    error: function(t, n) {
                        e.hasOwnProperty("error") && e.error()
                    }
                })
            },
            requestCheckCoverage: function(e) {
                var n = this;
                i.request({
                    resource: "top.coverage.check",
                    data: {
                        accountId: n.accountId,
                        zipCode: e.data.zipCode
                    },
                    success: function(i, s) {
                        i.success ? n.requestGetAddressInfo({
                            data: {
                                zipCode: e.data.zipCode
                            },
                            success: function(n) {
                                t.extend(!0, i, {
                                    formatted_address: n.formatted_address
                                }), e.hasOwnProperty("success") && e.success(i)
                            }
                        }) : (r.warning(n.i18n.active().mobileApp.toastr.error.invalidZipCode), e.hasOwnProperty("error") && e.error())
                    },
                    error: function(t, n) {
                        e.hasOwnProperty("error") && e.error()
                    }
                })
            },
            requestGetAddressInfo: function(e) {
                var t = this;
                i.request({
                    resource: "google.geocode.address",
                    data: {
                        country: "US",
                        zipCode: e.data.zipCode
                    },
                    success: function(t, n) {
                        t.results.length ? e.hasOwnProperty("success") && e.success(t.results[0]) : e.hasOwnProperty("error") && e.error()
                    },
                    error: function(t, n) {
                        e.hasOwnProperty("error") && e.error()
                    }
                })
            }
        };
    return s
});