define(["require", "jquery", "underscore", "monster", "toastr"], function(e) {
    var t = e("jquery"),
        n = e("underscore"),
        r = e("monster"),
        toastr = e("toastr"),
        s = {
            name: "carriers",
            css: ["app"],
            i18n: {
                "en-US": {customCss: !1},
                "es-ES": {customCss: !1},
                "fr-FR": {customCss: !1},
                "nl-NL": {customCss: !1},
                "de-DE": {customCss: !1},
                "dk-DK": {customCss: !1},
                "it-IT": {customCss: !1},
                "ro-RO": {customCss: !1},
                "pt-PT": {customCss: !1},
                "zh-CN": {customCss: !1},
                "ru-RU": {customCss: !1}
            },
            requests: {},
            subscribe: {},
            appFlags: {
                resourceType: "global",
                templateMode: !1,
                appData: {}
            },
            load: function(e) {
                var t = this;
                t.initApp(function() {
                    e && e(t)
                })
            },
            initApp: function(e) {
                var t = this;
                r.pub("auth.initApp", {
                    app: t,
                    callback: e
                })
            },
            render: function(e) {
                var n = this,
                    e = e || t("#monster-content");
                    // accountid switch urs
                    n.accountId = r.apps.auth.accountId;
                e.empty().append(r.template(n, "app")), n.appFlags.resourceType = "global", n.listAccountIPs(function(e) {
                    e.length >= 2 ? n.renderApp() : n.renderIPs(e)
                })
            },
            renderIPs: function(e, i) {
                var s = this,
                    i = n.isEmpty(i) ? t("#carriers_container") : container;
                templateData = {
                    ownedIPs: e
                }, s.listZones(function(e) {
                    templateData.zones = e;
                    var n = s.ipsFormatData(templateData),
                        o = t(r.template(s, "ip-manager", n));
                    s.ipsBindEvents(o), i.empty().append(o)
                })
            },
            ipsBindEvents: function(e) {
                var i = this;
                e.find(".zone:not(.error)").on("click", function() {
                    var n = t(this),
                        r = function() {
                            e.find(".zone.selected").length >= 2 ? e.find("#buy_ips").removeClass("disabled") : e.find("#buy_ips").addClass("disabled")
                        };
                    !n.hasClass("selected") && n.find(".ip").html() === "" ? i.getIP(n.data("zone"), function(e) {
                        e ? (n.find(".ip").html(e), n.addClass("selected"), r()) : (n.find(".ip").html(i.i18n.active().carriers.ips.noMore), n.addClass("error"))
                    }) : (t(this).toggleClass("selected"), r())
                }), e.find("#buy_ips").on("click", function() {
                    if (!t(this).hasClass("disabled")) {
                        var s = [];
                        e.find(".zone.selected .ip").each(function() {
                            s.push(t(this).html())
                        });
                        var o = {};
                        n.each(s, function(e) {
                            o[e] = function(t) {
                                i.addIP(e, function(e) {
                                    t(null, e)
                                })
                            }
                        }), r.parallel(o, function(e, t) {
                            i.render()
                        })
                    }
                }), e.find(".skip-step").on("click", function() {
                    i.renderApp()
                })
            },
            ipsFormatData: function(e) {
                var t = this,
                    i = t.i18n.active().carriers.ips.zones,
                    s = {
                        ownedIPs: e.ownedIPs,
                        zones: [],
                        isSuperDuper: r.util.isSuperDuper()
                    };
                return n.each(e.zones, function(e) {
                    s.zones.push({
                        name: e,
                        friendlyName: i.hasOwnProperty(e) ? i[e] : e
                    })
                }), s
            },
            renderApp: function(e) {
                var i = this;
                i.loadAppData(function() {
                    var e = {
                            isReseller: r.apps.auth.currentAccount.is_reseller || !1,
                            isSuperDuper: r.util.isSuperDuper(r.apps.auth.currentAccount),
                            hasImportJobs: r.apps.auth.currentAccount.wnm_allow_additions || !1,
                            useGlobal: i.appFlags.resourceType === "global"
                        },
                        s = t(r.template(i, "carrier-manager", e)),
                        o = n.isEmpty(o) ? t("#carriers_container") : container;
                    i.bindEvents(s), s.find('[data-toggle="tooltip"]').tooltip(), i.renderSelectedCategory({
                        template: s
                    }), o.empty().append(s)
                })
            },
            loadAppData: function(e) {
                var t = this;
                r.parallel({
                    classifiers: function(e) {
                        t.getClassifiersMetadata(function(n) {
                            t.appFlags.appData.classifiers = n, e(null, {})
                        })
                    }
                }, function(t, n) {
                    e && e()
                })
            },
            bindEvents: function(e) {
                var n = this;
                e.find(".category.level").on("click", function() {
                    var r = t(this);
                    e.find(".category.level").removeClass("selected"), r.addClass("selected"), n.changeResourceType(r.data("level"))
                }), e.find(".category:not(.level)").on("click", function() {
                    e.find(".category").removeClass("active"), t(this).addClass("active"), n.renderSelectedCategory()
                })
            },
            changeResourceType: function(e) {
                var t = this;
                t.appFlags.resourceType = e, t.renderSelectedCategory()
            },
            renderSelectedCategory: function(e) {
                var n = this,
                    e = e || {},
                    r = e.template || t("#carriers_container"),
                    i = r.find(".category.active").attr("id"),
                    s = r.find(".right-content"),
                    o = e.dataId || undefined;
                s.empty();
                switch (i) {
                    case "service_providers":
                        n.appFlags.templateMode = !1, n.serviceProvidersRender(s, o);
                        break;
                    case "calling_priorities":
                        n.callingPrioritiesRender(s);
                        break;
                    case "import_numbers":
                        n.listingJobsRender(s);
                        break;
                    case "carrier_templates":
                        n.appFlags.templateMode = !0, n.carrierTemplatesRender(s, o)
                }
            },
            listingJobsRender: function(e) {
                var n = this,
                    i = t(r.template(n, "listingJobs-layout"));
                i.find('[data-toggle="tooltip"]').tooltip(), n.listingJobsBindEvents(i), n.listingJobsRefreshList(i, function() {
                    e.append(i)
                })
            },
            listingJobsBindEvents: function(e) {
                var t = this;
                e.find(".create-job").on("click", function() {
                    t.listingJobsRenderCreate()
                }), e.find(".refresh-list").on("click", function() {
                    t.listingJobsRefreshList(e)
                })
            },
            listingJobsRefreshList: function(e, n) {
                var i = this,
                    s = e.find(".existing-jobs-wrapper"),
                    o = r.template(i, "listingJobs-listLoadingPlaceholder");
                s.empty().append(o), i.listingJobsGetData(function(e) {
                    var o = t(r.template(i, "listingJobs-list", e));
                    o.find(".view-job").on("click", function() {
                        var e = t(this).parents(".job-wrapper").data("id");
                        i.listingJobsRenderView(e)
                    }), s.empty().append(o), n && n()
                })
            },
            listingJobsGetData: function(e) {
                var t = this;
                t.listJobs(function(n) {
                    n = t.listingJobsFormatData(n), e && e(n)
                })
            },
            listingJobsFormatData: function(e) {
                var r = this,
                    i = {
                        listJobs: []
                    };
                return n.each(e, function(e) {
                    var e = t.extend(!0, {}, e, {
                        extra: {}
                    });
                    e.status === "complete" ? e.failures === 0 ? e.extra.status = "success" : e.successes === 0 ? e.extra.status = "failed" : e.extra.status = "errors" : e.extra.status = "pending", i.listJobs.push(e)
                }), i
            },
            listingJobsRenderCreate: function() {
                var e = this;
                e.listingJobsGetCreateData(function(n) {
                    var i = t(r.template(e, "listingJobs-add", n)),
                        s = {
                            position: ["center", 20],
                            title: e.i18n.active().carriers.listingJobs.create
                        },
                        o = function() {
                            popup.dialog("close").remove()
                        };
                    i.find(".logo-wrapper").append(r.template(e, "carrierLogo", n.listCarriers[0])), e.listingJobsBindCreateEvents(i, n, o), popup = r.ui.dialog(i, s)
                })
            },
            listingJobsBindCreateEvents: function(e, s, o) {
                var u = this;
                e.find("#carrier_selector").on("change", function() {
                    var i = t(this).val(),
                        o = {};
                    n.each(s.listCarriers, function(e) {
                        e.id === i && (o = e)
                    });
                    var a = r.template(u, "carrierLogo", o);
                    e.find(".logo-wrapper").empty().append(a)
                }), e.find("#create_job").on("click", function() {
                    var e = t(this),
                        n = r.ui.getFormData("form_add_job");
                    n.numbers = n.numbers.replace(/\s/g, "").split(",");
                    var s = u.formatCreateJobData(n);
                    u.createJob(s, function(e) {
                        toastr.success(r.template(u, "!" + u.i18n.active().carriers.listingJobs.dialogAdd.created, {
                            name: e.name
                        })), u.renderSelectedCategory(), o && o()
                    })
                }), e.find(".cancel-link").on("click", function() {
                    o && o()
                })
            },
            formatCreateJobData: function(e) {
                var t = e,
                    i = [];
                return n.each(t.numbers, function(e) {
                    e = r.util.unformatPhoneNumber(e, "keepPlus"), e !== "" && i.push(e)
                }), t.numbers = i, t
            },
            listingJobsGetCreateData: function(e) {
                var t = this;
                t.listResources(function(n) {
                    var r = t.listingJobsFormatCreateData(n);
                    e && e(r)
                })
            },
            listingJobsFormatCreateData: function(e) {
                var t = this,
                    r = t.getBrands(),
                    i = {
                        listCarriers: e
                    };
                return n.each(i.listCarriers, function(e) {
                    e.extra = {}, e.extra.brandName = t.getBrandName(e, r)
                }), i
            },
            listingJobsRenderView: function(e) {
                var n = this;
                n.listingJobsGetViewData(e, function(e) {
                    var i = t(r.template(n, "listingJobs-view", e)),
                        s = {
                            position: ["center", 20],
                            title: r.template(n, "!" + n.i18n.active().carriers.listingJobs.dialogView.title, {
                                name: e.name
                            })
                        };
                    i.find(".results-wrapper").append(r.ui.results(e.results)), i.find('[data-toggle="tooltip"]').tooltip();
                    var o = r.ui.dialog(i, s)
                })
            },
            listingJobsGetViewData: function(e, t) {
                var n = this;
                n.getJob(e, function(e) {
                    n.getResource(e.resource_id, function(r) {
                        var i = {
                                job: e,
                                carrier: r
                            },
                            s = n.listingJobsFormatViewData(i);
                        t && t(s)
                    })
                })
            },
            listingJobsFormatViewData: function(e) {
                var i = this,
                    s = i.getBrands(),
                    o = t.extend(!0, {}, e.job, {
                        extra: {
                            carrier: e.carrier
                        },
                        results: {
                            successes: [],
                            errors: []
                        }
                    });
                return o.extra.carrier.brandName = i.getBrandName(o.extra.carrier, s), n.each(e.job.success, function(e, t) {
                    o.results.successes.push({
                        id: t,
                        value: r.util.formatPhoneNumber(t)
                    })
                }), n.each(e.job.errors, function(e, t) {
                    e.hasOwnProperty("reason") && e.reason in i.i18n.active().carriers.listingJobs.dialogView.errors ? e.errorMessage = i.i18n.active().carriers.listingJobs.dialogView.errors[e.reason] : e.hasOwnProperty("message") && (e.errorMessage = e.message), o.results.errors.push({
                        id: t,
                        value: r.util.formatPhoneNumber(t),
                        errorMessage: e.errorMessage
                    })
                }), o.results.countTotal = o.results.successes.length + o.results.errors.length, o
            },
            callingPrioritiesRender: function(e) {
                var n = this;
                n.callingPrioritiesGetData(function(i) {
                i.extra = {};
                if(typeof i.account.priotity_by_lcrroute !== 'undefined') {i.extra.lcrroute = i.account.priotity_by_lcrroute;i.extra.lcrmargin = i.account.priotity_by_lcrmargin;} else i.extra.lcrroute = false;
                    var s = t(r.template(n, "callingPriorities-layout", i));
                    s.find('[data-toggle="tooltip"]').tooltip(), s.find(".ordered-carriers").sortable(), n.callingPrioritiesBindEvents(s, i), e.append(s)
                    if(i.extra.lcrroute == true) /*{*/ $('.rank').hide() //, toastr.success(n.i18n.active().carriers.callingPriorities.lcrrouteActivated, '', {"timeout": 10000}) }
                    else /*{*/ $('.rank').show()//, toastr.warning(n.i18n.active().carriers.callingPriorities.nolcrrouteActivated, '', {"timeout": 10000}) }
                })
            },
            callingPrioritiesBindEvents: function(e, n) {
                var r = this;
                e.find('[name="extra.lrcroute"]').val(n.account.priotity_by_lcrroute);
                setTimeout(function() {
                    e.find(".classifiers-selector .search-query").focus()
                }), e.find('#lcrroute').on('change', function() {
                        var toggle = $(this);
                        enable = toggle.prop('checked');
                        if(enable == true) { $('.rank').hide(), toastr.success(r.i18n.active().carriers.callingPriorities.lcrrouteActivated, '', {"timeout": 10000}) }
                        else { $('.rank').show(), toastr.warning(r.i18n.active().carriers.callingPriorities.nolcrrouteActivated, '', {"timeout": 10000}) }
                }), e.find('[name="extra.priority"]').on("change", function(t) {
                    e.find(".priority-type-wrapper").removeClass("active"), e.find('.priority-type-wrapper[data-type="' + t.target.value + '"]').addClass("active"), e.find(".cancel-priorities").show()
                }), e.find(".save-priorities").on("click", function() {
                    r.callingPrioritiesSave(e, n, function(e) {
                        toastr.success(r.i18n.active().carriers.callingPriorities.prioritiesUpdated), r.renderSelectedCategory()
                    })
                }), e.find(".cancel-priorities").on("click", function() {
                    r.renderSelectedCategory()
                }), e.find(".classifiers-selector .search-query").on("keyup", function(n) {
                    var r = t(this).val();
                    r ? e.find(".priority-type-wrapper.advanced .classifier-item").each(function() {
                        var e = t(this);
                        e.data("search").indexOf(r) >= 0 ? e.show() : e.hide()
                    }) : e.find(".priority-type-wrapper.advanced .classifier-item").show()
                }), e.find(".priority-type-wrapper.advanced .classifier-item").on("click", function() {
                    var n = t(this);
                    e.find(".classifier-item").removeClass("selected"), n.addClass("selected"), e.find(".priority-type-wrapper.advanced .carriers-list").removeClass("active"), e.find('.priority-type-wrapper.advanced .carriers-list[data-classifier="' + n.data("classifier") + '"]').addClass("active")
                }), e.find(".ordered-carriers").on("sortupdate", function(n) {
                    var r = t(this),
                        i = 1;
                    r.find(".carrier-block").each(function() {
                        t(this).find(".rank").html(i++)
                    }), e.find(".cancel-priorities").show()
                })
            },
            callingPrioritiesGetData: function(e) {
                var t = this;
                r.parallel({
                    account: function(e) {
                        t.callApi({
                            resource: "account.get",
                            data: {
                                accountId: t.accountId
                            },
                            success: function(t) {
                                e(null, t.data)
                            }
                        })
                    },
                    resources: function(e) {
                        t.listResources(function(t) {
                            e && e(null, t)
                        })
                    }
                }, function(n, r) {
                    r = t.callingPrioritiesFormatData(r), e && e(r)
                })
            },
            callingPrioritiesFormatData: function(e) {
                var r = this,
                    i = e,
                    s = r.getBrands(),
                    o = !1;
                i.classifiers = r.appFlags.appData.classifiers, n.each(i.classifiers, function(e) {
                    e.hasCarriersOn = !1, e.carriers = [], o || (o = !0, e.default = !0)
                }), n.each(i.resources, function(e) {
                    e.stringClassifier = r.getClassifierString(e), e.brandName = r.getBrandName(e, s), n.each(e.classifiers, function(n, r) {
                        if (r in i.classifiers) {
                            n.enabled && (i.classifiers[r].hasCarriersOn = !0);
                            var s = t.extend(!0, {}, e);
                            delete s.classifiers, s.weight_cost = e.classifiers[r].weight_cost, s.enabled = e.classifiers[r].enabled, i.classifiers[r].carriers.push(s)
                        }
                    })
                }), i.resources.sort(function(e, t) {
                    var n = parseInt(e.weight_cost),
                        r = parseInt(t.weight_cost);
                    return n < r ? -1 : 1
                }), n.each(i.classifiers, function(e) {
                    e.carriers.sort(function(e, t) {
                        return e.weight_cost < t.weight_cost ? -1 : 1
                    })
                });
                var u = 1;
                return n.each(i.resources, function(e) {
                    e.rank = u++
                }), n.each(i.classifiers, function(e) {
                    u = 1, n.each(e.carriers, function(e) {
                        e.rank = u++
                    })
                }), i
            },
            callingPrioritiesSave: function(e, i, s) {
                var o = this,
                    u = {
                        carriers: []
                    },
                    a = 1,
                    f = !1,
                    l = e.find('[name="extra.priority"]:checked').val() === "different";
                    i.lcr = e.find('[name="extra.lcrroute"]:checked').val() === "on";
                    i.lcrmargin = e.find('[name="extra.lcrmargin"]').val();
                if (l) {
                    var c = {};
                    e.find(".priority-type-wrapper.advanced .classifier-item").each(function() {
                        var n = 1,
                            r = t(this).data("classifier");
                        e.find('.carriers-list[data-classifier="' + r + '"] .carrier-block').each(function() {
                            var e = t(this),
                                i = e.data("id"),
                                s = e.find('[type="checkbox"]').is(":checked");
                            c.hasOwnProperty(i) || (c[i] = {
                                id: i,
                                classifiers: {}
                            }), c[i].classifiers[r] = {
                                enabled: s,
                                weight_cost: n++
                            }
                        })
                    }), n.each(c, function(e) {
                        u.carriers.push(e)
                    })
                } else f = !0, e.find(".priority-type-wrapper.basic .ordered-carriers .carrier-block").each(function() {
                    var e = t(this),
                        n = {
                            id: e.data("id"),
                            enabled: e.find('[type="checkbox"]').is(":checked"),
                            weight_cost: a++
                        };
                    n.enabled && (f = !1), u.carriers.push(n)
                });
                var h = function() {
                    r.parallel({
                        account: function(e) {
                             o.getAccount(o.accountId, function(t) {
                                t.resources_by_classifiers = i.account.resources_by_classifiers, t.priotity_by_lcrroute = i.lcr, t.priotity_by_lcrmargin = i.lcrmargin
                                , o.updateAccount(t, function(t) {
                                    e && e(null, t)
                                })
                            })// : e && e(null, i.account)
                        },
                        resources: function(e) {
                            o.updateCollectionResource(u, function(t) {
                                e && e(null, t)
                            })
                        }
                    }, function(e, t) {
                        s && s()
                    })
                };
                f ? r.ui.confirm(o.i18n.active().carriers.callingPriorities.warningNoCarriersEnabled, function() {
                    h()
                }) : h()
            },
            carrierTemplatesRender: function(e, n) {
                var i = this;
                i.carrierTemplatesGetData(function(s) {
                    var o = t(r.template(i, "serviceProviders-layout", s));
                    o.find('[data-toggle="tooltip"]').tooltip(), i.listingBindEvents(o), e.append(o), n && r.ui.highlight(o.find('.carrier-block[data-id="' + n + '"]'))
                })
            },
            carrierTemplatesGetData: function(e) {
                var t = this;
                r.parallel({
                    templates: function(e) {
                        t.callApi({
                            resource: "resourceTemplates.list",
                            data: {
                                accountId: t.accountId
                            },
                            success: function(t) {
                                e(null, t.data)
                            }
                        })
                    },
                    resource: function(e) {
                        t.callApi({
                            resource: "resourceTemplates.list",
                            data: {
                                accountId: t.accountId,
                                filters: {
                                    local: !0
                                }
                            },
                            success: function(t) {
                                e(null, t.data)
                            }
                        })
                    }
                }, function(n, r) {
                    r = t.listingFormatData(r), e && e(r)
                })
            },
            serviceProvidersRender: function(e, n) {
                var i = this;
                i.serviceProvidersGetData(function(s) {
                    var o = t(r.template(i, "serviceProviders-layout", s));
                    o.find('[data-toggle="tooltip"]').tooltip(), i.listingBindEvents(o), e.append(o), n && r.ui.highlight(o.find('.carrier-block[data-id="' + n + '"]'))
                })
            },
            serviceProvidersGetData: function(e) {
                var t = this;
                r.parallel({
                    templates: function(e) {
                        t.callApi({
                            resource: "resourceTemplates.list",
                            data: {
                                accountId: t.accountId
                            },
                            success: function(t) {
                                e(null, t.data)
                            }
                        })
                    },
                    resource: function(e) {
                        t.listResources(function(t) {
                            e(null, t)
                        })
                    }
                }, function(n, r) {
                    r = t.listingFormatData(r), e && e(r)
                })
            },
            listingFormatData: function(e) {
                var t = this,
                    r = {
                        extra: {}
                    },
                    i = t.getBrands(),
                    s = {};
                return n.each(e.resource, function(e) {
                    e.extra = e.extra || {}, e.extra.stringClassifier = t.getClassifierString(e), e.extra.brandName = t.getBrandName(e, i)
                }), n.each(e.templates, function(e) {
                    e.extra = e.extra || {}, e.extra.help = e.name, e.extra.brandName = t.getBrandName(e, i)
                }), r = {
                    mode: t.appFlags.templateMode ? "template" : "carriers",
                    availableCarriers: e.templates,
                    usedCarriers: e.resource
                }, r
            },
            getBrandName: function(e, t) {
                var n = this;
                return e.hasOwnProperty("template_name") ? e.template_name in t ? e.template_name : "custom" : "other"
            },
            getClassifierString: function(e) {
                var t = this,
                    r = "";
                return e.hasOwnProperty("classifiers") && n.each(e.classifiers, function(e, n) {
                    if(t.appFlags.appData.classifiers[n]) { console.log(n); // failed classifiers!
                    var i = t.appFlags.appData.classifiers[n].friendly_name;
                    } else var i = n;
                    e.enabled && (r += r === "" ? i : ", " + i)
                }), r
            },
            listingBindEvents: function(e) {
                var n = this;
                e.find(".add-carrier").on("click", function() {
                    var e = {
                        templateId: t(this).data("id") || !1,
                        mode: "create",
                        type: n.appFlags.templateMode ? "template" : "carriers"
                    };
                    n.listingRenderEditResource(e, function(e) {
                        n.renderSelectedCategory({
                            dataId: e.id
                        })
                    })
                }), e.find(".carrier-block").on("click", function(e) {
                    if (!t(e.target).hasClass("remove-carrier")) {
                        var r = {
                            carrierId: t(this).data("id"),
                            mode: "edit",
                            type: n.appFlags.templateMode ? "template" : "carriers"
                        };
                        n.appFlags.templateMode === !0 && (r.templateId = r.carrierId, delete r.carrierId), n.listingRenderEditResource(r, function(e) {
                            n.renderSelectedCategory({
                                dataId: e.id
                            })
                        })
                    }
                }), e.find(".remove-carrier").on("click", function() {
                    var e = t(this).parents(".carrier-block").data(),
                        s = e.name || "",
                        o = n.appFlags.templateMode === !0 ? "templateDeleted" : "providerDeleted",
                        u = n.appFlags.templateMode === !0 ? "warningDeleteTemplate" : "warningDeleteProvider",
                        a = r.template(n, "!" + n.i18n.active().carriers.toastrMessages[u], {
                            name: s
                        }),
                        f = r.template(n, "!" + n.i18n.active().carriers.toastrMessages[o], {
                            name: s
                        });
                    r.ui.confirm(a, function() {
                        n.deleteResource(e.id, function() {
                            toastr.success(f), n.renderSelectedCategory()
                        })
                    })
                })
            },
            listingRenderEditResource: function(e, n) {
                var i = this;
                i.getDataEditResource(e, function(s) {
                    s = i.formatDataEditResource(s, e);
                    var o = t(r.template(i, "serviceProviders-editResource", s));
                    i.listingPrepareTemplateBeforeRender(o, s), i.listingEditBindEvents(o, s, function(e) {
                        c.dialog("close").remove(), e && n && n(e)
                    });
                    var u = s.extra.mode === "create" ? "add" : "edit",
                        a = s.extra.type === "carriers" ? "CarrierTitle" : "TemplateTitle",
                        f = u + a,
                        l = {
                            position: ["center", 20],
                            title: r.template(i, "!" + i.i18n.active().carriers.serviceProviders.editResource[f], {
                                variable: s.resource.name
                            })
                        },
                        c = r.ui.dialog(o, l);
                    r.ui.wysiwyg(c.find(".wysiwyg-container")).html(s.resource.notes || "")
                })
            },
            listingPrepareTemplateBeforeRender: function(e, i) {
                var s = this,
                    o = !1,
                    u = !1;
                n.each(i.extra.mapClassifiers, function(t) {
                    t.active ? (o = !0, e.find(".list-classifiers").append(r.template(s, "serviceProviders-classifier", t))) : (u = !0, e.find(".dropdown-classifier .dropdown-menu").append(r.template(s, "serviceProviders-addClassifier", t)))
                }), o === !1 && e.find(".list-classifiers").append(r.template(s, "serviceProviders-classifier")), u === !1 && e.find(".dropdown-classifier .dropdown-toggle").addClass("disabled"), t.each(i.resource.flags, function(t, n) {
                    e.find(".list-flags .saved-entities").append(r.template(s, "serviceProviders-flag", {
                        name: n
                    }))
                }), r.ui.datepicker(e.find("#contract_expiration_date"), {
                    minDate: new Date
                })
            },
            listingEditBindEvents: function(e, n, s) {
                var o = this,
                    u = function(t) {
                        t.preventDefault();
                        var n = e.find("#flag_name"),
                            i = n.val();
                        templateFlag = r.template(o, "serviceProviders-flag", {
                            name: i
                        }), e.find(".list-flags .saved-entities").prepend(templateFlag), n.val("").focus()
                    };
                r.ui.tabs(e), e.find('[data-toggle="tooltip"]').tooltip();
                var a = r.ui.codecSelector("audio", e.find("#audio_codec_selector"), n.resource.media.audio.codecs),
                    f = r.ui.codecSelector("video", e.find("#video_codec_selector"), n.resource.media.video.codecs);
                e.find('select[name="template_name"]').change(function() {
                    var e = t(this),
                        n = e.val(),
                        r = e.parents(".template-name-fields").siblings(".template-name-additional");
                    n !== "other" ? (r.find(".fields-other").removeClass("active"), r.find(".carrier-logo").removeClass().addClass("carrier-logo active " + n)) : (r.find(".fields-other").addClass("active"), r.find(".carrier-logo").removeClass().addClass("carrier-logo"))
                }), e.find(".list-ips").on("click", ".add-ip", function(t) {
                    e.find(".list-ips").append(r.template(o, "serviceProviders-serverIPLine"))
                }), e.find(".list-ips").on("click", ".delete-ip", function(e) {
                    t(this).parents(".server-ip").remove()
                }), e.find("#add_flag").on("click", function(e) {
                    u(e)
                }), e.find("#flag_name").on("keypress", function(e) {
                    var t = e.keyCode || e.which;
                    t === 13 && u(e)
                }), e.find(".list-flags .saved-entities").on("click", ".delete-entity", function() {
                    t(this).parents(".entity-wrapper").remove()
                }), e.find("#save_resource").on("click", function() {
                    var t = o.normalizeDataResource(n, r.ui.getFormData("resource_form"), e, a, f);
                    o.saveResource(t, function(e) {
                        var n = t.hasOwnProperty("id") ? o.i18n.active().carriers.toastrMessages.carrierUpdated : o.i18n.active().carriers.toastrMessages.carrierCreated;
                        toastr.success(r.template(o, "!" + n, {
                            name: e.name
                        })), s && s(e)
                    })
                }), e.find("#cancel_link").on("click", function() {
                    s && s()
                }), e.find('[name="extra.authType"]').on("change", function(t) {
                    e.find(".input-wrapper").removeClass("active"), e.find('.input-wrapper[data-type="' + t.currentTarget.value + '"]').addClass("active").find("input:first-child").focus()
                }), e.find(".entity-wrapper.placeholder:not(.active)").on("click", function() {
                    t(this).addClass("active"), e.find("#flag_name").focus()
                }), e.find("#cancel_flag").on("click", function(n) {
                    n.stopPropagation(), t(this).siblings("input").val(""), e.find(".entity-wrapper.placeholder").removeClass("active")
                }), e.find("#resource_form").on("change", ".checkbox-show-div", function(e) {
                    var n = t(this),
                        r = n.is(":checked"),
                        i = t(this).parents(".controls").find(".linked-to-select");
                    r === !0 ? i.addClass("active") : i.removeClass("active")
                }), e.find(".list-classifiers").on("click", ".classifier .edit-classifier", function() {
                    var e = t(this),
                        n = e.parents(".classifier").find(".settings");
                    n.toggle()
                }), e.find(".list-classifiers").on("click", ".classifier .remove-classifier", function() {
                    var i = t(this),
                        s = i.parents(".classifier"),
                        u = s.data("type"),
                        a = n.extra.mapClassifiers[u];
                    s.siblings().length === 0 && e.find(".list-classifiers").append(r.template(o, "serviceProviders-classifier")), s.remove(), e.find(".dropdown-classifier .dropdown-menu").append(r.template(o, "serviceProviders-addClassifier", a)), e.find(".dropdown-classifier .dropdown-toggle").removeClass("disabled")
                }), e.find(".dropdown-classifier").on("click", ".add-classifier", function() {
                    var i = t(this),
                        s = i.data("type"),
                        u = t.extend(!0, {
                            enabled: !0
                        }, n.extra.mapClassifiers[s]),
                        a = t(r.template(o, "serviceProviders-classifier", u));
                    e.find(".list-classifiers .alert.empty").remove(), e.find(".list-classifiers").prepend(a), i.siblings().length === 0 && i.parents(".dropdown-classifier").find(".dropdown-toggle").addClass("disabled"), i.remove()
                });
                var l = function(e, t) {
                        var n = t.exec(e),
                            r;
                        if (n.length > 1) {
                            n.shift();
                            var i, s = "";
                            for (var o = 0; o < n.length; o++) n[o].length > s.length && (s = n[o]);
                            r = s
                        } else r = n[0];
                        return r
                    },
                    c = function(e) {
                        var t = e.find(".prefix").val(),
                            n = e.find(".suffix").val(),
                            r = e.find(".number-test").val(),
                            i = e.find(".regex-input").val(),
                            s, o = function() {
                                e.find(".result-testing.failure").show(), e.find(".result-testing.success").hide(), e.find(".result-testing-container").show()
                            },
                            u = function(i) {
                                var s = l(r, i);
                                e.find(".result-testing.failure").hide(), e.find(".formatted-number").html(t + s + n), e.find(".result-testing.success").show(), e.find(".result-testing-container").show()
                            };
                        if (r === "") e.find(".result-testing-container").hide();
                        else try {
                            s = new RegExp(i), s.test(r) ? u(s) : o()
                        } catch (a) {
                            o()
                        }
                    };
                e.find(".list-classifiers").on("keyup", ".number-test, .prefix, .suffix, .regex-input", function(e) {
                    c(t(this).parents(".settings"))
                })
            },
            saveResource: function(e, t) {
                var n = this;
                e.hasOwnProperty("id") ? n.updateResource(e, function(e) {
                    t && t(e)
                }) : n.createResource(e, function(e) {
                    t && t(e)
                })
            },
            getDataEditResource: function(e, t) {
                var n = this;
                r.parallel({
                    classifiers: function(e) {
                        e && e(null, n.appFlags.appData.classifiers)
                    },
                    listIPs: function(e) {
                        n.listAccountIPs(function(t) {
                            e && e(null, t)
                        })
                    },
                    resource: function(t) {
                        if (e.mode === "edit") {
                            var r = e.type === "template" ? e.templateId : e.carrierId;
                            n.getResource(r, function(e) {
                                e = n.migrateResourceData(e), t && t(null, e)
                            })
                        } else e.hasOwnProperty("templateId") && e.templateId !== !1 ? n.getTemplate(e.templateId, function(e) {
                            e = n.migrateResourceData(e), t && t(null, e)
                        }) : t && t(null, {})
                    }
                }, function(e, n) {
                    t && t(n)
                })
            },
            migrateResourceData: function(e) {
                var t = this;
                if (e.gateways.length > 0 && e.gateways[0].hasOwnProperty("codecs") && e.gateways[0].codecs.length > 0) {
                    var r = [];
                    n.each(e.gateways[0].codecs, function(e) {
                        r.push(e)
                    }), e.media = e.media || {}, e.media.audio = e.media.audio || {}, e.media.audio.codecs = r, delete e.gateways[0].codecs
                }
                return e
            },
            formatDataEditResource: function(e, r) {
                var i = this,
                    s = i.i18n.active().carriers.serviceProviders.editResource.codecs,
                    o = e.resource.hasOwnProperty("gateways") ? e.resource.gateways[0] : {},
                    u = {
                        resource: e.resource,
                        extra: {
                            defaultBrand: i.getDefaultBrand(),
                            templateBrands: i.getBrands(),
                            listIPs: e.listIPs,
                            fullListClassifiers: e.classifiers,
                            mapClassifiers: {},
                            hasRoute: o.hasOwnProperty("route"),
                            hasCustomSIP: o.hasOwnProperty("custom_sip_interface"),
                            authType: o.hasOwnProperty("username") && o.hasOwnProperty("password") ? "creds" : "ip",
                            knownBrand: i.isKnownBrand(e.resource.template_name),
                            notSelectedCodecs: {
                                audio: [],
                                video: []
                            },
                            selectedCodecs: {
                                audio: [],
                                video: []
                            },
                            progressTimeouts: ["3", "4", "5", "6", "7", "8", "9", "10", "15", "20"],
                            calleridFormats: ["e164", "nochange", "local", "national", "international"],
                            channelSelections: ["ascending", "descending"],
                            endpointTypes: ["sip", "freetdm", "skype", "amqp"]
                        }
                    },
                    a = {
                        classifiers: {},
                        flags: [],
                        gateways: [{
                            progress_timeout: "8"
                        }],
                        media: {
                            audio: {
                                codecs: []
                            },
                            video: {
                                codecs: []
                            },
                            fax_option: !1
                        }
                    };
                return u.extra.knownBrand && (u.extra.friendlyBrand = u.extra.templateBrands[u.resource.template_name]), u.extra.brandName = i.getBrandName(u.resource, u.extra.templateBrands), u.extra.type = r.type, u.extra.mode = r.mode, r.mode === "create" && delete u.resource.id, u.extra.type = r.type, u.extra.mode = r.mode, u.extra.templateBrands.other = i.i18n.active().carriers.brands.other, u.template_name in u.extra.templateBrands && (u.extra.selectedBrand = u.template_name), u.resource = t.extend(!0, {}, a, u.resource), u.resource.classifiers = u.resource.classifiers || {}, n.each(u.extra.fullListClassifiers, function(e, n) {
                    u.extra.mapClassifiers[n] = e, u.extra.mapClassifiers[n].key = n, n in u.resource.classifiers && (u.resource.classifiers[n].hasOwnProperty("regex") && (u.resource.classifiers[n].isCustom = !0), u.resource.classifiers[n].active = !0, u.extra.mapClassifiers[n] = t.extend(!0, {}, u.extra.fullListClassifiers[n], u.resource.classifiers[n]))
                }), u
            },
            normalizeDataResource: function(e, i, s, o, u) {
                var a = this,
                    f = t.extend(!0, {}, e.resource, i);
                return f.notes = s.find(".wysiwyg-editor").html(), f.contract_expiration_date = r.util.dateToGregorian(s.find("#contract_expiration_date").datepicker("getDate")), f.classifiers = i.classifiers, f.gateways = i.gateways, n.each(f.classifiers, function(e) {
                    e.extra.isCustom ? e.regex = e.extra.customized_match : delete e.regex, delete e.extra
                }), f.template_name === "other" && (f.template_name = f.extra.templateName), f.flags = [], s.find(".list-flags .saved-entities .entity-wrapper").each(function() {
                    f.flags.push(t(this).data("name"))
                }), f.media.audio.codecs = o.getSelectedItems(), f.media.video.codecs = u.getSelectedItems(), f.extra.hasCustomSIP === !1 && delete f.gateways[0].custom_sip_interface, f.extra.hasRoute === !1 && delete f.gateways[0].route, f.format_from_uri === !1 && delete f.from_uri_realm, f.gateways[0].server = i.extra.servers[0], f.gateways[0].realm === "" && delete f.gateways[0].realm, f.extra.authType === "ip" && (delete f.gateways[0].username, delete f.gateways[0].password), n.each(i.extra.servers, function(e, n) {
                    n !== 0 && f.gateways.push(t.extend(!0, {}, f.gateways[0], {
                        server: e
                    }))
                }), delete f.extra, f
            },
            getArrayBrands: function() {
                var e = this;
                return ["freetdm", "skype", "amqp", "bandwidth", "broadvox", "call_centric", "level3", "onsip", "onvoy", "peatec", "verizon", "vitelity", "voice_plus", "voip_innovations",
                        "efon", "sipcall", "netvoip", "sipgate", "winet", "netswiss", "swisscom", "sunrise", "calltrade", "telekom", "t42com", "sky_telecom",
                        "bt", "mitto", "horisen", "oblcom", "att", "quickcom"]
            },
            getDefaultBrand: function() {
                var e = this;
                return e.getArrayBrands()[0]
            },
            getBrands: function() {
                var e = this,
                    t = e.i18n.active().carriers.brands,
                    r = e.getArrayBrands(),
                    i = {};
                return n.each(r, function(e) {
                    i[e] = t[e]
                }), i
            },
            isKnownBrand: function(e) {
                var t = this,
                    e = e || "",
                    n = t.getBrands();
                return e in n
            },
            getAccount: function(e, t) {
                var n = this;
                n.callApi({
                    resource: "account.get",
                    data: {
                        accountId: n.accountId
                    },
                    success: function(e) {
                        t && t(e.data)
                    }
                })
            },
            updateAccount: function(e, t) {
                var n = this;
                n.callApi({
                    resource: "account.update",
                    data: {
                        accountId: n.accountId,
                        data: e
                    },
                    success: function(e) {
                        t && t(e.data)
                    }
                })
            },
            getTemplate: function(e, t) {
                var n = this;
                n.callApi({
                    resource: "resourceTemplates.get",
                    data: {
                        accountId: n.accountId,
                        resourceId: e
                    },
                    success: function(e) {
                        t && t(e.data)
                    }
                })
            },
            listResources: function(e) {
                var t = this;
                t.callApi({
                    resource: t.appFlags.resourceType + "Resources.list",
                    data: {
                        accountId: t.accountId
                    },
                    success: function(t) {
                        e(t.data)
                    }
                })
            },
            getResource: function(e, t) {
                var n = this,
                    r = "",
                    i = {};
                n.appFlags.templateMode === !0 ? (r = "resourceTemplates.get", i = {
                    local: !0
                }) : r = n.appFlags.resourceType + "Resources.get", n.callApi({
                    resource: r,
                    data: {
                        filters: i,
                        accountId: n.accountId,
                        resourceId: e
                    },
                    success: function(e) {
                        t && t(e.data)
                    }
                })
            },
            createResource: function(e, t) {
                var n = this,
                    r = "",
                    i = {};
                n.appFlags.templateMode === !0 ? (r = "resourceTemplates.create", i = {
                    local: !0
                }) : r = n.appFlags.resourceType + "Resources.create", n.callApi({
                    resource: r,
                    data: {
                        filters: i,
                        accountId: n.accountId,
                        data: e
                    },
                    success: function(e) {
                        t && t(e.data)
                    }
                })
            },
            updateResource: function(e, t) {
                var n = this,
                    r = "",
                    i = {};
                n.appFlags.templateMode === !0 ? (r = "resourceTemplates.update", i = {
                    local: !0
                }) : r = n.appFlags.resourceType + "Resources.update", n.callApi({
                    resource: r,
                    data: {
                        filters: i,
                        accountId: n.accountId,
                        data: e,
                        resourceId: e.id
                    },
                    success: function(e) {
                        t && t(e.data)
                    }
                })
            },
            updateCollectionResource: function(e, t) {
                var n = this,
                    r = n.appFlags.resourceType + "Resources.updateCollection";
                n.callApi({
                    resource: r,
                    data: {
                        accountId: n.accountId,
                        data: e.carriers
                    },
                    success: function(e) {
                        t && t(e.data)
                    }
                })
            },
            deleteResource: function(e, t) {
                var n = this,
                    r = "",
                    i = {};
                n.appFlags.templateMode === !0 ? (r = "resourceTemplates.delete", i = {
                    local: !0
                }) : r = n.appFlags.resourceType + "Resources.delete", n.callApi({
                    resource: r,
                    data: {
                        filters: i,
                        accountId: n.accountId,
                        resourceId: e
                    },
                    success: function(e) {
                        t && t(e.data)
                    }
                })
            },
            getClassifiersMetadata: function(e) {
                var t = this;
                t.callApi({
                    resource: "numbers.listClassifiers",
                    data: {
                        accountId: t.accountId
                    },
                    success: function(t) {
                        e && e(t.data)
                    }
                })
            },
            listAccountIPs: function(e) {
                var t = this;
                t.callApi({
                    resource: "ips.listAssigned",
                    data: {
                        accountId: t.accountId
                    },
                    success: function(t) {
                        e && e(t.data)
                    }
                })
            },
            getIP: function(e, t) {
                var n = this;
                n.callApi({
                    resource: "ips.list",
                    data: {
                        accountId: n.accountId,
                        zone: e,
                        quantity: 1
                    },
                    success: function(e) {
                        var n = "";
                        e.data.length > 0 && (n = e.data[0].ip), t && t(n)
                    }
                })
            },
            addIP: function(e, t) {
                var n = this;
                n.callApi({
                    resource: "ips.add",
                    data: {
                        accountId: n.accountId,
                        ip: e
                    },
                    success: function(e) {
                        t && t(e.data)
                    }
                })
            },
            deleteIP: function(e, t) {
                var n = this;
                n.callApi({
                    resource: "ips.delete",
                    data: {
                        accountId: n.accountId,
                        ip: e
                    },
                    success: function(e) {
                        t && t(e.data)
                    }
                })
            },
            listZones: function(e) {
                var t = this;
                t.callApi({
                    resource: "ips.listZones",
                    data: {
                        accountId: t.accountId
                    },
                    success: function(t) {
                        e && e(t.data)
                    }
                })
            },
            listJobs: function(e) {
                var t = this,
                    n = t.appFlags.resourceType + "Resources.listJobs";
                t.callApi({
                    resource: n,
                    data: {
                        accountId: t.accountId
                    },
                    success: function(t) {
                        e && e(t.data)
                    }
                })
            },
            createJob: function(e, t) {
                var n = this,
                    r = n.appFlags.resourceType + "Resources.createJob";
                n.callApi({
                    resource: r,
                    data: {
                        accountId: n.accountId,
                        data: e
                    },
                    success: function(e) {
                        t && t(e.data)
                    }
                })
            },
            getJob: function(e, t) {
                var n = this,
                    r = n.appFlags.resourceType + "Resources.getJob";
                n.callApi({
                    resource: r,
                    data: {
                        accountId: n.accountId,
                        jobId: e
                    },
                    success: function(e) {
                        t && t(e.data)
                    }
                })
            }
        };
    return s
});