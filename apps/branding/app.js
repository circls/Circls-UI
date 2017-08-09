define(["require", "jquery", "underscore", "monster", "toastr"],
    function(e) {
        var t = e("jquery"),
            n = e("underscore"),
            r = e("monster"),
            i = e("toastr"),
            l = e('monster-language'),
            s = {
                name: "branding",
                css: ["app"],
                i18n: {
                    "en-US": {
                        customCss: !1
                    },
                    "de-DE": {
                        customCss: !1
                    },
                    "dk-DK": {
                        customCss: !1
                    },
                    "it-IT": {
                        customCss: !1
                    },
                    "ro-RO": {
                        customCss: !1
                    },
                    "ru-RU": {
                        customCss: !1
                    },
                    "nl-NL": {
                        customCss: !1
                    },
                    "es-ES": {
                        customCss: !1
                    },
                    "pt-PT": {
                        customCss: !1
                    },
                    "zh-CN": {
                        customCss: !1
                    },
                    "fr-FR": {
                        customCss: !1
                    }
                },
                requests: {},
                subscribe: {},
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
                render: function(e, t) {
                    var n = this;
                    n._render(e, t)
                },
                _render: function(e, n) {
                    var i = this,
                        s = e || t("#monster-content"),
                        o = t(r.template(i, "app"));
                    i.loadBrandingData(function(e) {
                        e.brandingDoc || o.find('.category[data-template="advanced"]').hide(), s.empty().append(o), o.find('.category[data-template="' + (n || "general") + '"]').toggleClass("active"), i.renderBrandingTab(n, o.find(".right-content"), e), i.bindBrandingEvents(o, e)
                    })
                },
                loadBrandingData: function(e) {
                    var t = this;
                    r.parallel({
                        brandingDoc: function(e) {
                            t.callApi({
                                resource: "whitelabel.get",
                                data: {
                                    accountId: t.accountId,
                                    generateError: !1
                                },
                                success: function(t) {
                                    e && e(null, t.data)
                                },
                                error: function(t) {
                                    e && e(null, null)
                                }
                            })
                        },
                        brandingLogo: function(e) {
                            var n = new XMLHttpRequest,
                                r = t.apiUrl + "accounts/" + t.accountId + "/whitelabel/logo?auth_token=" + t.authToken;
                            n.open("GET", r, !0), n.onreadystatechange = function() {
                                n.readyState === 4 && (n.status === 200 ? e && e(null, r) : e && e(null, null))
                            }, n.send()
                        },
                        brandingIcon: function(e) {
                            t.callApi({
                                resource: "whitelabel.getIcon",
                                data: {
                                    accountId: t.accountId,
                                    generateError: !1,
                                    dataType: "*"
                                },
                                success: function(n) {
                                    var r = t.apiUrl + "accounts/" + t.accountId + "/whitelabel/icon?auth_token=" + t.authToken;
                                    e && e(null, r)
                                },
                                error: function(t) {
                                    e && e(null, null)
                                }
                            })
                        },
                        passwordRecovery: function(e) {
                            t.callApi({
                                resource: "whitelabel.getNotification",
                                data: {
                                    accountId: t.accountId,
                                    notificationId: "password_recovery",
                                    generateError: !1
                                },
                                success: function(t) {
                                    e && e(null, t.data)
                                },
                                error: function(t) {
                                    e && e(null, null)
                                }
                            })
                        }
                    }, function(t, n) {
                        n.brandingDoc && n.passwordRecovery && n.passwordRecovery.enabled === !1 && (n.brandingDoc.hidePasswordRecovery = !0), delete n.passwordRecovery, e && e(n)
                    })
                },
                bindBrandingEvents: function(e, n) {
                    var r = this;
                    e.find(".category").on("click", function() {
                        var i = t(this),
                            s = i.data("template"),
                            o = e.find(".right-content");
                        e.find(".category").removeClass("active"), i.toggleClass("active"), r.renderBrandingTab(s, o, n)
                    })
                },
                renderBrandingTab: function(e, t, n) {
                    var r = this,
                        i = {
                            template: t,
                            brandingData: n
                        };
                    t.empty();
                    switch (e) {
                        case "advanced":
                            r.renderAdvancedBranding(i);
                            break;
                        case "templates":
                            r.renderTemplatesBranding(i);
                            break;
                        case "dns":
                            r.renderDnsBranding(i);
                            break;
                        case "general":
                        default:
                            r.renderGeneralBranding(i)
                    }
                },
                renderGeneralBranding: function(e) {
                    var n = this,
                        i = e.template,
                        s = e.brandingData,
                        o = t(r.template(n, "general", s)),
                        u = {
                            small: !1,
                            normal: !1,
                            big: !1
                        };
                    if (s.brandingDoc) l.populateDropdown(o.find('#account_language'), s.brandingDoc.language);
                    else l.populateDropdown(o.find('#account_language'));
                    s.brandingDoc && s.brandingDoc.hasOwnProperty("custom_welcome_message") && o.find("#custom_welcome_message").val(s.brandingDoc.custom_welcome_message), r.ui.tooltips(o), i.empty().append(o), r.ui.validate(i.find("#general_branding_form")), n.bindGeneralBrandingEvents({
                        template: o,
                        brandingData: s
                    })
                },
                bindGeneralBrandingEvents: function(e) {
                    var i = this,
                        s = e.template,
                        o = e.brandingData,
                        u = ["image/png", "image/jpeg"],
                        a = null,
                        f = function() {
                            var e = s.find(".logo-preview"),
                                t = e.data("original-logo") ? "url(" + e.data("original-logo") + ")" : "";
                            t ? e.css("background-image", t).toggleClass("empty", !1) : e.css("background-image", "none").toggleClass("empty", !0), s.find(".reset-logo").hide(), s.find(".logo-upload-div .file-upload input").val(""), a = null
                        },
                        l = null,
                        c = function() {
                            var e = s.find(".favicon-preview"),
                                t = e.data("original-favicon") ? "url(" + e.data("original-favicon") + ")" : "";
                            t ? e.css("background-image", t).toggleClass("empty", !1) : e.css("background-image", "none").toggleClass("empty", !0), s.find(".reset-favicon").hide(), s.find(".favicon-upload-div .file-upload input").val(""), l = null
                        };
                    s.find("#company_logo_input").fileUpload({
                        inputOnly: !0,
                        wrapperClass: "file-upload input-append",
                        btnClass: "monster-button-mini",
                        mimeTypes: u,
                        success: function(e) {
                            var t = new Image;
                            t.onload = function(e) {
                                this.width <= 190 && this.height <= 72 ? (s.find(".logo-preview").css("background-image", "url(" + t.src + ")").removeClass("empty"), s.find(".reset-logo").show()) : (r.ui.alert("error", i.i18n.active().alertMessages.logoWrongSize), f())
                            }, a = e[0].file, t.src = e[0].file
                        },
                        error: function(e) {
                            e.hasOwnProperty("mimeTypes") && e.mimeTypes.length > 0 && r.ui.alert("error", i.i18n.active().alertMessages.logoWrongType), f()
                        }
                    }), s.find("#company_icon_input").fileUpload({
                        inputOnly: !0,
                        wrapperClass: "file-upload input-append",
                        btnClass: "monster-button-mini",
                        success: function(e) {
                            var t = new Image;
                            t.onload = function(e) {
                                this.width <= 64 && this.height <= 64 ? (s.find(".favicon-preview").css("background-image", "url(" + t.src + ")").removeClass("empty"), s.find(".reset-favicon").show()) : (r.ui.alert("error", i.i18n.active().alertMessages.faviconWrongSize), c())
                            }, l = e[0].file, t.src = e[0].file
                        },
                        error: function(e) {
                            c()
                        }
                    }), s.find(".reset-logo").on("click", f), s.find(".reset-favicon").on("click", c), s.find("#custom_welcome").on("change", function() {
                        t(this).prop("checked") ? s.find(".welcome-message-container").slideDown() : s.find(".welcome-message-container").slideUp()
                    }), s.find(".save").on("click", function() {
                        if (r.ui.valid(s.find("#general_branding_form"))) {
                            var e = i.generalBrandingFormatData(r.ui.getFormData("general_branding_form"), o.brandingDoc);
                            i.callApi({
                                resource: o.brandingDoc ? "whitelabel.update" : "whitelabel.create",
                                data: {
                                    accountId: i.accountId,
                                    data: e
                                },
                                success: function(e) {
                                    var t = {},
                                        s = function() {
                                            i.render(null, "general")
                                        };
                                    a && (t.logo = function(e) {
                                        i.callApi({
                                            resource: "whitelabel.updateLogo",
                                            data: {
                                                accountId: i.accountId,
                                                data: a
                                            },
                                            success: function(t) {
                                                e(null, t)
                                            },
                                            error: function(t) {
                                                e(null, t)
                                            }
                                        })
                                    }), l && (t.icon = function(e) {
                                        i.callApi({
                                            resource: "whitelabel.updateIcon",
                                            data: {
                                                accountId: i.accountId,
                                                data: l
                                            },
                                            success: function(t) {
                                                e(null, t)
                                            },
                                            error: function(t) {
                                                e(null, t)
                                            }
                                        })
                                    }), n.isEmpty(t) ? s() : r.parallel(t, s)
                                }
                            })
                        }
                    }), s.find(".delete").on("click", function() {
                        r.ui.confirm(i.i18n.active().alertMessages.deleteConfirm, function() {
                            i.callApi({
                                resource: "whitelabel.delete",
                                data: {
                                    accountId: i.accountId
                                },
                                success: function(e) {
                                    i.render(null, "general")
                                },
                                error: function(e) {
                                    i.render(null, "general")
                                }
                            })
                        })
                    })
                },
                generalBrandingFormatData: function(e, n) {
                    return e.hide_powered = !e.hide_powered, e = t.extend(!0, {}, n, e), e.callReportEmail == "" && delete e.callReportEmail,
                        e.language == "auto" && delete e.language, e
                },
                renderAdvancedBranding: function(e) {
                    var n = this,
                        i = e.template,
                        s = e.brandingData,
                        o = t(r.template(n, "advanced", n.formatAdvancedBrandingData(s)));
                    i.empty().append(o), i.find(".choices-list").sortable({
                        items: ".choices-element.clickable-box",
                        cancel: ".choices-element.flat-box"
                    }).disableSelection(), r.ui.validate(i.find("#advanced_branding_form")), n.bindAdvancedBrandingEvents({
                        template: o,
                        brandingData: s
                    })
                },
                formatAdvancedBrandingData: function(e) {
                    var r = this,
                        i = [{
                            key: "useBlended",
                            name: r.i18n.active().advancedBranding.carrier.choices.list.useBlended
                        }, {
                            key: "useReseller",
                            name: r.i18n.active().advancedBranding.carrier.choices.list.useReseller
                        }, {
                            key: "byoc",
                            name: r.i18n.active().advancedBranding.carrier.choices.list.byoc
                        }],
                        s = t.extend({
                            portAuthority: r.accountId,
                            selectedChoices: [],
                            unselectedChoices: []
                        }, e);
                    return s.brandingDoc && s.brandingDoc.carrier && s.brandingDoc.carrier.choices ? (n.each(s.brandingDoc.carrier.choices, function(e) {
                        s.selectedChoices.push({
                            key: e,
                            name: r.i18n.active().advancedBranding.carrier.choices.list[e]
                        })
                    }), n.each(i, function(e) {
                        s.brandingDoc.carrier.choices.indexOf(e.key) < 0 && s.unselectedChoices.push(e)
                    })) : s.selectedChoices = i, s
                },
                bindAdvancedBrandingEvents: function(e) {
                    var n = this,
                        i = e.template,
                        s = e.brandingData;
                    i.find('input[name="port.authority"]').on("change", function() {
                        t(this).val() ? i.find(".advanced-info").show() : i.find(".advanced-info").hide()
                    }), i.find(".choices-element-ckb").on("change", function(e) {
                        var n = t(this),
                            r = n.parents(".choices-element");
                        if (r.hasClass("clickable-box") && i.find(".choices-element.clickable-box").length <= 1) n.prop("checked", !0);
                        else {
                            var s = i.find(".choices-element.flat-box:first");
                            s.length ? s.before(r) : i.find(".choices-element.clickable-box:last").after(r), r.toggleClass("flat-box").toggleClass("clickable-box")
                        }
                    }), i.find(".save").on("click", function() {
                        if (r.ui.valid(i.find("#advanced_branding_form"))) {
                            var e = r.ui.getFormData("advanced_branding_form"),
                                o = t.extend(!0, {}, s.brandingDoc, e);
                            o.hide_port = o.hide_port === "true", o.carrier || (o.carrier = {}), o.carrier.choices = i.find(".choices-element.clickable-box").map(function() {
                                return t(this).data("value")
                            }).get(), n.callApi({
                                resource: "whitelabel.update",
                                data: {
                                    accountId: n.accountId,
                                    data: o
                                },
                                success: function(e) {
                                    n.render(null, "advanced")
                                }
                            })
                        }
                    })
                },
                renderTemplatesBranding: function(e) {
                    var n = this,
                        e = e || {},
                        i = e.template || t("#monster-content .right-content"),
                        s = e.brandingData;
                    n.listBrandingTemplates(function(e) {
                        var o = t(r.template(n, "templates", {
                            brandingTemplates: n.formatTemplateListData(e)
                        }));
                        i.empty().append(o), r.ui.tooltips(o), n.bindTemplatesBrandingEvents({
                            template: o,
                            brandingTemplates: e,
                            brandingData: s
                        })
                    })
                },
                formatTemplateListData: function(e) {
                    var i = this,
                        s = [];
                    return n.each(e, function(e, i) {
                        s.push({
                            categoryKey: i,
                            categoryName: e.categoryName,
                            templates: r.util.sort(n.map(e.templates, function(e, n) {
                                return t.extend(!0, {
                                    templateKey: n
                                }, e)
                            }), "templateName")
                        })
                    }), r.util.sort(s, "categoryName"), s
                },
                bindTemplatesBrandingEvents: function(e) {
                    var n = this,
                        r = e.template,
                        i = e.brandingTemplates,
                        s = e.brandingData;
                    r.find(".category-header").on("click", function() {
                        var e = t(this);
                        e.parents(".category-container").toggleClass("open"), e.find("i").toggleClass("fa-caret-down").toggleClass("fa-caret-right"), e.siblings(".category-content").stop().slideToggle()
                    }), r.find(".template-header").on("click", function() {
                        var e = t(this).parents(".template-container"),
                            r = e.data("template"),
                            o = e.parents(".category-container").data("category");
                        n.renderTemplateEdition({
                            container: e,
                            templateBaseData: i[o].templates[r],
                            brandingData: s
                        })
                    })
                },
                renderTemplateEdition: function(e) {
                    var i = this,
                        s = e.container,
                        o = e.templateBaseData,
                        u = s.data("template"),
                        a = e.brandingData;
                    i.getBrandingTemplate(u, function(f) {
                        var l = t.extend(!0, {
                                templateKey: u
                            }, o, f),
                            c = t(r.template(i, "templateContent", i.formatTemplateEditionData(l))),
                            h = [];
                        n.each(o.macros, function(e, t) {
                            h.push({
                                text: e.friendly_name,
                                args: t
                            })
                        }), r.ui.tooltips(c), c.find("#" + u + "_text_body").val(f.text), s.find(".template-header").hide(), s.find(".template-content").empty().append(c).show(), r.ui.wysiwyg(s.find(".wysiwyg-container"), {
                            macro: {
                                options: h
                            }
                        }).html(f.html), s.toggleClass("open", !0), t("body").append(t('<div id="branding_templates_overlay"></div>')), c.offset() && t("html, body").animate({
                            scrollTop: c.offset().top - 30
                        }, 300), i.bindTemplateEditionEvents(t.extend(!0, {
                            template: c,
                            templateData: f,
                            templateKey: u,
                            brandingData: a
                        }, e))
                    })
                },
                formatTemplateEditionData: function(e) {
                    var t = this;
                    return e.data.to.email_addresses = e.data.to.email_addresses.join(", "), e.data.bcc.email_addresses = e.data.bcc.email_addresses.join(", "), e
                },
                bindTemplateEditionEvents: function(e) {
                    var n = this,
                        s = e.template,
                        o = e.templateData,
                        u = e.templateKey,
                        a = e.brandingData,
                        f = function(r) {
                            r ? n.renderTemplatesBranding({
                                brandingData: a
                            }) : (e.container.toggleClass("open", !1), e.container.find(".template-content").empty().hide(), e.container.find(".template-header").show()), t("body").find("#branding_templates_overlay").remove()
                        },
                        l = function() {
                            var e = r.ui.getFormData(u + "_form"),
                                n = e.to.email_addresses.trim().replace(/[;\s,]+/g, ","),
                                i = e.bcc.email_addresses.trim().replace(/[;\s,]+/g, ",");
                            return e.to.type = s.find(".to-group .recipient-radio.active").data("value"), e.to.email_addresses = n.length ? n.split(",") : [], e.bcc.type = s.find(".bcc-group .recipient-radio.active").data("value"), e.bcc.email_addresses = i.length ? i.split(",") : [], t.extend(!0, {}, o.data, e)
                        },
                        c = s.find(".switch");
                    c.on("change", function(e, n) {
                        s.find(".content").toggleClass("disabled", !t(this).prop("checked"))
                    }), s.find(".recipient-radio").on("click", function() {
                        var e = t(this);
                        e.closest(".form-line").find("input").prop("disabled", e.data("value") != "specified")
                    }), s.find(".macro-element").on("click", function() {
                        var e = t(this),
                            n = s.find(e.data("target")),
                            r = n[0].selectionEnd,
                            i = n.val();
                        n.val(i.substr(0, r) + "{{" + e.data("macro") + "}}" + i.substr(r)), n.focus()
                    }), s.find(".body-tabs a").on("click", function(e) {
                        e.preventDefault(), t(this).tab("show")
                    }), s.find(".preview-email-send").on("click", function() {
                        var e = l(),
                            t = s.find("#" + u + "_preview_recipient").val(),
                            o = s.find(".preview-email-container");
                        e.bcc.type = "specified", e.bcc.email_addresses = [], e.to.type = "specified", e.to.email_addresses = [t], e.plain = s.find("#" + u + "_text_body").val(), e.html = btoa(s.find(".wysiwyg-editor").cleanHtml()), o.addClass("disabled"), n.callApi({
                            resource: "whitelabel.previewNotification",
                            data: {
                                accountId: n.accountId,
                                notificationId: u,
                                data: e
                            },
                            success: function(e, s) {
                                o.removeClass("disabled"), i.success(r.template(n, "!" + n.i18n.active().alertMessages.templatePreviewSuccess, {
                                    email_address: t
                                }))
                            },
                            error: function(e, t) {
                                o.removeClass("disabled")
                            }
                        })
                    }), s.find(".action-bar .restore").on("click", function() {
                        r.ui.confirm(n.i18n.active().templatesBranding.restoreWarning, function() {
                            n.callApi({
                                resource: "whitelabel.deleteNotification",
                                data: {
                                    accountId: n.accountId,
                                    notificationId: u
                                },
                                success: function(e, t) {
                                    n.callApi({
                                        resource: "whitelabel.get",
                                        data: {
                                            accountId: n.accountId,
                                            generateError: !1
                                        },
                                        success: function(e) {
                                            e.data.hidePasswordRecovery = !1, n.callApi({
                                                resource: "whitelabel.update",
                                                data: {
                                                    accountId: n.accountId,
                                                    data: e.data
                                                },
                                                success: function(e) {
                                                    a.brandingDoc = e.data
                                                }
                                            })
                                        }
                                    }), f(!0), i.success(n.i18n.active().alertMessages.templateRestoreSuccess)
                                }
                            })
                        })
                    }), s.find(".action-bar .save").on("click", function() {
                        if (c.prop("checked")) {
                            var e = l();
                            e.enabled = !0, n.callApi({
                                resource: "whitelabel.updateNotification",
                                data: {
                                    accountId: n.accountId,
                                    notificationId: u,
                                    data: e
                                },
                                success: function(e, t) {
                                    n.callApi({
                                        resource: "whitelabel.updateNotificationHtml",
                                        data: {
                                            accountId: n.accountId,
                                            notificationId: u,
                                            data: s.find(".wysiwyg-editor").cleanHtml()
                                        },
                                        success: function(e, t) {
                                            n.callApi({
                                                resource: "whitelabel.updateNotificationText",
                                                data: {
                                                    accountId: n.accountId,
                                                    notificationId: u,
                                                    data: s.find("#" + u + "_text_body").val()
                                                },
                                                success: function(e, t) {
                                                    f(!0), i.success(n.i18n.active().alertMessages.templateUpdateSuccess)
                                                }
                                            })
                                        }
                                    }), u === "password_recovery" && n.callApi({
                                        resource: "whitelabel.get",
                                        data: {
                                            accountId: n.accountId,
                                            generateError: !1
                                        },
                                        success: function(e) {
                                            e.data.hidePasswordRecovery = !1, n.callApi({
                                                resource: "whitelabel.update",
                                                data: {
                                                    accountId: n.accountId,
                                                    data: e.data
                                                },
                                                success: function(e) {
                                                    a.brandingDoc = e.data
                                                }
                                            })
                                        }
                                    })
                                }
                            })
                        } else o.data.enabled && (o.data.enabled = !1, n.callApi({
                            resource: "whitelabel.updateNotification",
                            data: {
                                accountId: n.accountId,
                                notificationId: u,
                                data: o.data
                            },
                            success: function(e, t) {
                                u === "password_recovery" && n.callApi({
                                    resource: "whitelabel.get",
                                    data: {
                                        accountId: n.accountId,
                                        generateError: !1
                                    },
                                    success: function(e) {
                                        e.data.hidePasswordRecovery = !0, n.callApi({
                                            resource: "whitelabel.update",
                                            data: {
                                                accountId: n.accountId,
                                                data: e.data
                                            },
                                            success: function(e) {
                                                a.brandingDoc = e.data
                                            }
                                        })
                                    }
                                }), f(!0), i.success(n.i18n.active().alertMessages.templateUpdateSuccess)
                            }
                        }))
                    }), s.find(".action-bar .cancel").on("click", function() {
                        r.ui.confirm(n.i18n.active().alertMessages.closeTemplateConfirm, function() {
                            f()
                        })
                    }), t("body").find("#branding_templates_overlay").on("click", function() {
                        r.ui.confirm(n.i18n.active().alertMessages.closeTemplateConfirm, function() {
                            f()
                        })
                    })
                },
                listBrandingTemplates: function(e) {
                    var t = this;
                    templateList = {}, t.callApi({
                        resource: "whitelabel.listNotifications",
                        data: {
                            accountId: t.accountId
                        },
                        success: function(r, i) {
                            r.data && r.data.length && (n.each(r.data, function(e) {
                                "category" in e || (e.category = "misc"), e.category in templateList || (templateList[e.category] = {
                                    categoryName: t.i18n.active().templatesBranding.templateCategories[e.category] || e.category,
                                    templates: {}
                                }), templateList[e.category].templates[e.id] = {
                                    templateName: t.i18n.active().templatesBranding.templateNames[e.id] || e.friendly_name || e.id,
                                    status: e.hasOwnProperty("enabled") && e.enabled === !1 ? "disabled" : e.account_overridden ? "custom" : "default",
                                    macros: e.macros
                                }
                            }), e && e(templateList))
                        }
                    })
                },
                getBrandingTemplate: function(e, n) {
                    var i = this,
                        s = {
                            to: {
                                type: "original",
                                email_addresses: []
                            },
                            bcc: {
                                type: "specified",
                                email_addresses: []
                            },
                            from: "",
                            subject: "",
                            enabled: !0,
                            template_charset: "utf-8"
                        };
                    i.callApi({
                        resource: "whitelabel.getNotification",
                        data: {
                            accountId: i.accountId,
                            notificationId: e
                        },
                        success: function(o, u) {
                            r.parallel({
                                text: function(t) {
                                    i.callApi({
                                        resource: "whitelabel.getNotificationText",
                                        data: {
                                            accountId: i.accountId,
                                            notificationId: e
                                        },
                                        success: function(e, n) {
                                            t && t(null, e)
                                        },
                                        error: function(e, n) {
                                            t && t(null, null)
                                        }
                                    })
                                },
                                html: function(t) {
                                    i.callApi({
                                        resource: "whitelabel.getNotificationHtml",
                                        data: {
                                            accountId: i.accountId,
                                            notificationId: e
                                        },
                                        success: function(e, n) {
                                            t && t(null, e)
                                        },
                                        error: function(e, n) {
                                            t && t(null, null)
                                        }
                                    })
                                }
                            }, function(e, r) {
                                r.data = t.extend(!0, s, o.data), n && n(r)
                            })
                        },
                        error: function(e, t) {
                            n && n({
                                data: s
                            })
                        }
                    })
                },
                renderDnsBranding: function(e) {
                    var n = this,
                        i = e.template,
                        s = e.brandingData,
                        o = s.brandingDoc !== null && s.brandingDoc.hasOwnProperty("domain") ? s.brandingDoc.domain : undefined,
                        u = t(r.template(n, "dns", {
                            domain: o
                        }));
                    i.empty().append(u), o && n.renderDnsListing(e, o), n.bindDnsBrandingEvents({
                        template: u,
                        brandingData: s
                    })
                },
                renderDnsListing: function(e, n) {
                    var i = this,
                        s = e.template,
                        o = e.brandingData;
                    i.callApi({
                        resource: "whitelabel.checkDnsEntries",
                        data: {
                            accountId: i.accountId,
                            domain: n
                        },
                        success: function(e, o) {
                            var u = {
                                    data: i.formatDnsDataToTemplate(e.data),
                                    domain: n
                                },
                                a = t(r.template(i, "dnsListing", u));
                            s.find(".dns-listing-content").empty().append(a)
                        }
                    })
                },
                bindDnsBrandingEvents: function(e) {
                    var n = this,
                        i = e.template,
                        s = e.brandingData;
                    i.find(".check").on("click", function(i) {
                        i.stopPropagation();
                        var s = t(this).parent().find("#domain").val();
                        s ? n.renderDnsListing(e, s) : r.ui.alert("error", n.i18n.active().dnsBranding.toastr.error.invalidDomain)
                    })
                },
                formatDnsDataToTemplate: function(e) {
                    var t = this;
                    return n.each(e, function(e, t) {
                        n.each(e, function(e, n) {
                            e.recordType = t, e.errors = [], e.expected.forEach(function(t, n) {
                                e.errors.push(e.actual.indexOf(t) < 0)
                            })
                        })
                    }), e
                }
            };
        return s
    });