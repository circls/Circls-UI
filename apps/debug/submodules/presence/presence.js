define(["require", "jquery", "underscore", "prettify", "vkbeautify", "monster", "toastr"], function(e) {
    var n = e("jquery"),
        t = e("underscore"),
        r = (e("prettify"), e("vkbeautify"), e("monster")),
        s = e("toastr"),
        o = {
            requests: {},
            subscribe: {
                "debug.presence.render": "presenceRender"
            },
            ua_map: {
                name: "other",
                regexp: ".*",
                kind: "brand",
                info: {
                    img: "grandstream_gxp2130.jpg",
                    css: "ua ua-grandstream-gxp-2130"
                },
                inner: [{
                    name: "Polycom",
                    regexp: "polycom",
                    kind: "brand",
                    info: {
                        img: "polycom.jpg",
                        css: "ua ua-polycom"
                    },
                    inner: [{
                        name: "Polycom vvx",
                        kind: "family",
                        regexp: "vvx",
                        info: {
                            img: "polycom_vvx.jpg",
                            css: "ua ua-polycom-vvx"
                        },
                        inner: [{
                            name: "Polycom vvx 400",
                            kind: "model",
                            regexp: "vvx_400",
                            info: {
                                img: "polycom_vvx_400.jpg",
                                css: "ua ua-polycom-vvx-400"
                            }
                        }]
                    }]
                }, {
                    name: "Cisco",
                    regexp: "cisco",
                    kind: "brand",
                    info: {
                        img: "cisco.jpg",
                        css: "ua ua-cisco"
                    },
                    inner: [{
                        name: "Cisco SPA5XX",
                        kind: "family",
                        regexp: "spa",
                        info: {
                            img: "cisco_spa.jpg",
                            css: "ua ua-cisco-spa"
                        },
                        inner: [{
                            name: "Cisco SPA504G",
                            kind: "model",
                            regexp: "spa504",
                            info: {
                                img: "cisco_spa5xx_504g.jpg",
                                css: "ua ua-cisco-spa-504g"
                            }
                        }]
                    }]
                }, {
                    name: "Grandstream",
                    regexp: "grandstream",
                    kind: "brand",
                    info: {
                        img: "grandstream.jpg",
                        css: "ua ua-grandstream"
                    },
                    inner: [{
                        name: "Grandstream HD",
                        kind: "family",
                        regexp: "gxp",
                        info: {
                            img: "grandstream_hd.jpg",
                            css: "ua ua-grandstream-gxp"
                        },
                        inner: [{
                            name: "Grandstream GXP2130",
                            kind: "model",
                            regexp: "gxp2130",
                            info: {
                                img: "grandstream_gxp2130.jpg",
                                css: "ua ua-grandstream-gxp-2130"
                            }
                        }]
                    }]
                }, {
                    name: "bria",
                    regexp: "bria",
                    kind: "brand",
                    info: {
                        img: "bria.jpg",
                        css: "ua ua-counterpath-bria"
                    }
                }]
            },
            ua: function(e, n) {
                var t = this;
                for (void 0 === n && (n = t.ua_map), i = 0; i < n.inner.length; i++) {
                    a = n.inner[i];
                    var r = new RegExp(a.regexp, "gi");
                    if (r.test(e)) return console.log(a.info.img), void 0 !== a.inner ? t.ua(e, a) : (console.log(a), a)
                }
                return n
            },
            presenceRender: function(e) {
                var i = this,
                    a = a || {},
                    t = a.container || n("#debug_app_container .app-content-wrapper"),
                    s = n(r.template(i, "presence-list"));
                i.presenceInitTable(s, function() {
                    i.presenceBindEvents(s), t.fadeOut(function() {
                        n(this).empty().append(s).fadeIn()
                    })
                })
            },
            presenceFormatListingData: function(e) {
                var n = {
                    statuses: {}
                };
                return n
            },
            presenceBindEvents: function(e) {
                var i = this;
                e.find("#presence_grid tbody").on("click", ".flush-blf", function() {
                    var e = n(this).data("key");
                    i.presenceFlush(e, function() {
                        var n = r.template(i, "!" + i.i18n.active().presence.flushSent, {
                            variable: e
                        });
                        s.success(n)
                    })
                }), e.find("#presence_grid tbody").on("click", ".detail-link", function() {
                    var e = n(this).closest("tr")[0],
                        a = r.ui.table.presence.fnGetData(e).details,
                        t = n(r.template(i, "presence-presentity", {
                            metadata: a
                        }));
                    t.find("#close").on("click", function() {
                        s.dialog("close").remove()
                    }), t.find(".info-block").on("click", function() {
                        var e = n(this).find("pre").html().replace(/#013#010/g, "\n"),
                            a = i.unescapeHtml(e),
                            r = i.formatXml(a).replace(/\r\n/g, "<br/>");
                        console.log(r);
                        vkbeautify.xml(a);
                        t.find("#presentityBody pre").html(n(this).find("pre").html())
                    }), t.find(".technical-details-hide").on("click", function() {
                        t.find(".technical-details").show(), t.find(".technical-data, .technical-details-hide").hide()
                    });
                    var s = r.ui.dialog(t, {
                        title: i.i18n.active().registrations.detailDialog.popupTitle,
                        position: ["center", 20]
                    })
                })
            },
            escapeHtml: function(e) {
                return n("<div />").text(e).html()
            },
            unescapeHtml: function(e) {
                return n("<div />").html(e).text()
            },
            formatXml: function(e) {
                var n = /(>)\s*(<)(\/*)/g,
                    i = / *(.*) +\n/g,
                    a = /(<.+>)\s*(.+\n)/g;
                e = e.replace(n, "$1\n$2$3").replace(i, "$1\n").replace(a, "$1\n$2");
                for (var t = "", r = e.split("\n"), s = 0, c = "other", o = {
                        "single->single": 0,
                        "single->closing": -1,
                        "single->opening": 0,
                        "single->other": 0,
                        "closing->single": 0,
                        "closing->closing": -1,
                        "closing->opening": 0,
                        "closing->other": 0,
                        "opening->single": 1,
                        "opening->closing": 0,
                        "opening->opening": 1,
                        "opening->other": 1,
                        "other->single": 0,
                        "other->closing": -1,
                        "other->opening": 0,
                        "other->other": 0
                    }, l = 0; l < r.length; l++) {
                    var p = r[l],
                        u = Boolean(p.match(/<.+\/>/)),
                        g = Boolean(p.match(/<\/.+>/)),
                        d = Boolean(p.match(/<[^!].*>/)),
                        m = u ? "single" : g ? "closing" : d ? "opening" : "other",
                        f = c + "->" + m;
                    c = m;
                    var h = "";
                    s += o[f];
                    for (var v = 0; s > v; v++) h += "    ";
                    t += h + p + "\n"
                }
                return t
            },
            presenceInitTable: function(e, i) {
                var a = this,
                    t = [{
                        sTitle: a.i18n.active().presence.tableTitles.subscription,
                        mDataProp: "key"
                    }, {
                        sTitle: a.i18n.active().presence.tableTitles.mwi,
                        mDataProp: "mwi"
                    }, {
                        sTitle: a.i18n.active().presence.tableTitles.blf,
                        mDataProp: "blf"
                    }, {
                        sTitle: a.i18n.active().presence.tableTitles.presence,
                        mDataProp: "presence"
                    }, {
                        sTitle: a.i18n.active().presence.tableTitles.flush,
                        bSortable: !1,
                        sWidth: "20px",
                        mDataProp: null,
                        fnRender: function(e) {
                            return '<a href="#" class="flush-blf" data-key="' + e.aData.key + '"><i class="fa fa-refresh"></i></a>'
                        }
                    }, {
                        sTitle: a.i18n.active().registrations.tableTitles.details,
                        fnRender: function(e) {
                            return e.aData.details.length > 0 ? '<a href="#" class="detail-link monster-link blue"><i class="fa fa-eye"></i></a>' : ""
                        }
                    }];
                a.presenceGetData(function(a) {
                    r.ui.table.create("presence", e.find("#presence_grid"), t, a, {
                        sDom: '<"table-custom-actions">frtlip',
                        aaSorting: [
                            [0, "desc"]
                        ]
                    }), n.fn.dataTableExt.afnFiltering.pop(), i && i()
                })
            },
            presenceGetData: function(e) {
                var n = this;
                n.presenceList(function(i) {
                    var a = n.presenceFormatDataTable(i);
                    e && e(a)
                })
            },
            presenceFormatDataTable: function(e) {
                var n, i = this,
                    a = [];
                return e.hasOwnProperty("subscriptions") && t.each(e.subscriptions, function(r, s) {
                    mwi = 0, blf = 0, pr = 0, detailArray = [], t.each(r, function(e, a) {
                        n = 0, t.each(e, function(e, a) {
                            n++, c = i.ua(e.user_agent),
//                                console.log(c),
                                detail = {
                                kind: "subscriber",
                                id: e.from.replace(/@.*/g, ""),
                                proxy: e.stalker.replace("BLF-", ""),
                                expires: e.expires,
                                timestamp: e.timestamp,
                                user_agent: e.user_agent,
                                img: c.info.img,
                                css: c.info.css,
                                notify: e.hasOwnProperty("notify") ? {
                                    sequence: e.notify.sequence,
                                    reply: e.notify.reply,
                                    body: prettyPrintOne(i.escapeHtml(i.formatXml(e.notify.body)).replace(/\n/g, "<br/>"))
                                } : void 0
                            }, detailArray.push(detail)
                        }), "message-summary" == a ? mwi = n : "dialog" == a ? blf = n : "presence" == a && (pr = n)
                    }), e.hasOwnProperty("presentities") && e.presentities.hasOwnProperty(s) && t.each(e.presentities[s], function(e, n) {
                        t.each(e, function(e, a) {
                            t.each(e, function(e, t) {
                                detailArray.push({
                                    kind: "proxy",
                                    proxy: n.replace("kamailio@", ""),
                                    type: a,
                                    rowid: t,
                                    etag: e.etag,
                                    body: prettyPrintOne(i.escapeHtml(i.formatXml(e.body)).replace(/\n/g, "<br/>"))
                                })
                            })
                        })
                    }), a.push({
                        key: s,
                        mwi: mwi,
                        blf: blf,
                        presence: pr,
                        details: detailArray
                    })
                })
//                ,console.log(a)
                ,a
            },
            presenceList: function(e) {
                var n = this;
                n.callApi({
                    resource: "presence.list",
                    data: {
                        accountId: n.accountId
                    },
                    success: function(n) {
                        e && e(n.data)
                    }
                })
            },
            presenceFlush: function(e, n) {
                var i = this;
                i.callApi({
                    resource: "presence.update",
                    data: {
                        accountId: i.accountId,
                        presenceId: e,
                        data: {
                            reset: !0
                        }
                    },
                    success: function(e) {
                        n && n(e.data)
                    }
                })
            }
        };
    return o
});