define(["require", "jquery", "underscore", "monster", "toastr", "monster-flags", "chosenImage"], function(require) {
    var $ = require("jquery"),
        _ = require("underscore"),
        monster = require("monster"),
        toastr = require("toastr"),
        flags = require('monster-flags'),
        chosenImage = require('chosenImage'),

        app = {
            requests: {},
            subscribe: {
                "carriersettings.subdomains.render": "subdomainsRender"
            },
            appFlags: {
                tableData: []
            },
            subdomainsRender: function(content) {
                var self = this,
                    content = content || {},
                    index = content.parent || $(".right-content"),
                    template = $(monster.template(self, "subdomains-layout"));
                self.subdomainsInitTable(template, function() {
                    self.subdomainsBindEvents(template), index.empty().append(template)
                })
            }, subdomainsBindEvents: function(container) {
                var self = this;

                // upload subdomains
                container.on("click", "#upload-link", function() {
                    var data = $(this),
                        detail = $(monster.template(self, "upload", {
                            metadata: data
                        }));
                    detail.find(".cancel-link").on("click", function() {
                        edit.dialog("close").remove()

                    });
                    var edit = monster.ui.dialog(detail, {
                        title: self.i18n.active().subdomains.uploadDialog.popupTitle,
                        position: ["center", 20]
                    });
                }),
                // delete entry
                container.on("click", "#delete-subdomains-link", function() {
                    var data = $(this);
                        var checkedValues = $("input:checkbox:checked", "#subdomains_grid").map(function() {
                            return $(this).val();
                        }).get(); delete checkedValues['on'];
                        $.each(checkedValues, function(i, id) {
                                var entry = {};
                                entry.id = encodeURIComponent(id);
                                self.subdomainsDelete(entry, function(data) {
                                });
                        });
                        if(checkedValues.length > 0) {
                            self.subdomainsRender();
                            toastr.success(monster.template(self, '!' + self.i18n.active().subdomains.deleteSuccess ))
                        }
                }),
                // add entry
                container.on("click", "#add-subdomains-link", function() {
                    var data = $(this),
                        sList = {};
                        $.each(['id', 'active','subdomain','domain','renew','expire','ip4','ip6',
                            'password'], function(i, v) {
                                sList[v] = {
                                    name: 'metadata.' + v,
                                    id: 'metadata.'+ v,
                                    key: 'metadata.' + v,
                                    value: '',
                                    label: self.i18n.active().subdomains.tableTitles[v],
                                    type: self.getsubdomainsType(v),
                                    resource: self.getsubdomainsResource(v)
                                }
                        });
                        detail = $(monster.template(self, "subdomains-edit", {
                            metadata: '',
                            editlist: sList
                        }));
                    detail.find("#cancel").on("click", function() {
                        edit.dialog("close").remove()

                    }), detail.find("#book-detail-add").on("click", function() {
                        var formData = monster.ui.getFormData('subdomains_detail_dialog');
                        self.subdomainsAdd(formData.metadata, function(data) {
                                toastr.success(monster.template(self, '!' + self.i18n.active().subdomains.addSuccess + data.id ));
                                self.subdomainsRender();
                                edit.dialog('close').remove();
                        });
                    });
                    flags.populateDropdown(detail.find('#metadata_country'), 'inherit', {inherit: ''});
                    detail.find('#metadata_country').chosenImage({ search_contains: true, width: '220px' });
                    var edit = monster.ui.dialog(detail, {
                        title: self.i18n.active().subdomains.detailDialog.popupTitle,
                        position: ["center", 20]
                    });
                }),
                // edit entry
                container.on("click", ".detail-link", function() {
                    var data = $(this),
                        row = data.context.dataset.row,
                        sData = self.appFlags.tableData[row][6],
                        sList = {};
                        $.each(sData, function(i, id) {
                                sList[i] = {
                                    name: 'metadata.' + i,
                                    id: 'metadata.' + i,
                                    key: 'metadata.' + i,
                                    value: id,
                                    label: self.i18n.active().subdomains.tableTitles[i],
                                    type: self.getsubdomainsType(i),
                                    resource: self.getsubdomainsResource(i)
                                }
                        });
                        detail = $(monster.template(self, "subdomains-edit", {
                            metadata: sData,
                            editlist: sList
                        }));
                    detail.find("#cancel").on("click", function() {
                        edit.dialog("close").remove()
                    }), detail.find("#book-detail-delete").on("click", function() {
                        var formData = monster.ui.getFormData('subdomains_detail_dialog');
                        formData.metadata.id = encodeURIComponent(formData.metadata.id);
                        self.subdomainsDelete(formData.metadata, function(data) {
                                self.subdomainsRender();
                                edit.dialog('close').remove();
                                toastr.success(monster.template(self, '!' + self.i18n.active().subdomains.deleteSuccess + data.id ));
                        });

                    }), detail.find("#book-detail-update").on("click", function() {
                        var formData = monster.ui.getFormData('subdomains_detail_dialog');
                        formData.metadata.id = encodeURIComponent(formData.metadata.id);
                        self.subdomainsUpdate(formData.metadata, function(data) {
                                self.subdomainsRender();
                                edit.dialog('close').remove();
                                toastr.success(monster.template(self, '!' + self.i18n.active().subdomains.addSuccess + data.id ));
                        });
                    }),
                    flags.populateDropdown(detail.find('#metadata_country'), self.appFlags.tableData[row][1]||'inherit', {inherit: ''});
                    detail.find('#metadata_country').chosenImage({ search_contains: true, width: '220px' });
                    var edit = monster.ui.dialog(detail, {
                        title: self.i18n.active().subdomains.detailDialog.popupTitle,
                        position: ["center", 20]
                    });
                })
            }, getsubdomainsType: function(idx) {
                switch (idx) {
                    case 'id': return "hidden"; break;
                    case 'active': return "boolean"; break;
                    case 'domain': return "select"; break;
                    default: return "text";
                }
            }, getsubdomainsResource: function(v) {
            switch (v) {
                    case 'carrierid': return monster.resource; break; 
                    case 'direction': var a = {},
                        a = { id: 'outbound', name: v, 'off': 'inbound', 'on': 'outbound', labelon: 'outbound', labeloff: 'inbound'},
                        a = { id: 'inbound', name: v, 'off': 'inbound', 'on': 'outbound', labelon: 'outbound', labeloff: 'inbound'}; return a; break; 
                    case 'flatrate': return ['false', 'true']; break; 
                }
            }, subdomainsInitTable: function(template, func) {
                var self = this;
                    table = [
                    {
                        sTitle: '<input type="checkbox" id="select_all_bookentrys"/>',
                        sWidth: "40px",
                        bSortable: false,
                        fnRender: function(data) {
                            return '<input type="checkbox" class="select-checkbox" value="' + data.aData[7] + '"/>'
                        }
                    }, {
                        sTitle: self.i18n.active().subdomains.tableTitles.active,
                    }, {
                        sTitle: self.i18n.active().subdomains.tableTitles.domain,
                    }, {
                        sTitle: self.i18n.active().subdomains.tableTitles.renew
                    }, {
                        sTitle: self.i18n.active().subdomains.tableTitles.ip4
                    }, {
                        sTitle: self.i18n.active().subdomains.tableTitles.action,
                        bSortable: false,
                        fnRender: function(data) {
                            return '<a href="#" class="detail-link monster-link blue" data-row="' + data.iDataRow +'"><i class="fa fa-edit"></i></a>'
                        }
                    }, {
                        bVisible: !1
                    }];
                self.subdomainsGetData(function(data) {
//                    console.log(data),
                    monster.ui.table.create("subdomains", template.find("#subdomains_grid"), table, data, {
                        sDom: '<"actions_subdomains">frtlip',
                        aaSorting: [
                            [3, "asc"]
                        ]
                }),
                $.fn.dataTableExt.afnFiltering.pop(),func && func(),
                $("div.actions_subdomains", template).html('</button><button id="add-subdomains-link" class="monster-button monster-button-success" data-action="addd">' +
                self.i18n.active().subdomains.add +  '</button><button id="delete-subdomains-link" class="monster-button monster-button-danger" data-action="deleted">' +
                self.i18n.active().subdomains.delete + '</button><button id="upload-link" type="button" class="monster-button monster-button-success upload-action'+
                ' upload-submit"><i class="fa fa-upload"></i></button>'),
                $('#select_all_bookentrys').click(function (e) {
                    $(this).closest('table').find('td input:checkbox').prop('checked', this.checked);
                });
            })
            },
            subdomainsFormatDataTable: function(data) {
                var ret = [];
                return $.each(data, function() {
                    ret.push(['', this.prefix.substring(0,2)||'', this.carrierid||'', this.rate_name||'', this.prefix||'', this.rate_cost||'', this||'', this.id||''])
                }), ret
            },
            subdomainsGetData: function(callback) {
                var self = this;
                self.callApi({
                    resource: "subdomains.list",
                    data: {
                        accountId: self.accountId,
                        filters: { paginate:false }
                    },
                    success: function(data) {
                        var ret = self.subdomainsFormatDataTable(data.data);
                        self.appFlags.tableData = ret, callback && callback(ret)
                    }
                })
            },
            subdomainsAdd: function(data, callback){
                    var self = this;
                    self.callApi({
                            resource: 'subdomains.create',
                            data: {
                                    accountId: self.accountId,
                                    data: data
                            },
                            success: function(data) {
                                    callback(data.data);
                            }
                    });
            },

            subdomainsUpdate: function(data, callback){
                    var self = this;
                    self.callApi({
                            resource: 'subdomains.update',
                            data: {
                                    accountId: self.accountId,
                                    data: data
                            },
                            success: function(data) {
                                    callback && callback(data.data);
                            }
                    });
            },

            subdomainsDelete: function(data, callback){
                    var self = this;
                    self.callApi({
                            resource: 'subdomains.delete',
                            data: {
                                    accountId: self.accountId,
                                    subdomainsId: data.id,
                                    data: {}

                            },
                            success: function(data) {
                                    callback && callback(data.data);
                            }
                    });
            },

            getresource: function(callback){
                    var self = this;
                    self.callApi({
                            resource: 'globalResources.list',
                            data: {
                                accountId: self.accountId
                            },
                                success: function(data) {
                                    callback(data.data)
                            }
                    });
                }
        };
    return app
});