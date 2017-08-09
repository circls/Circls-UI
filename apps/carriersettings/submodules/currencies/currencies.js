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
                "carriersettings.currencies.render": "currenciesRender"
            },
            appFlags: {
                tableData: []
            },
            currenciesRender: function(content) {
                var self = this,
                    content = content || {},
                    index = content.parent || $(".right-content"),
                    template = $(monster.template(self, "currencies-layout"));
                self.currenciesInitTable(template, function() {
                    self.currenciesBindEvents(template), index.empty().append(template)
                })
            }, currenciesBindEvents: function(container) {
                var self = this;

                // upload currencies
                container.on("click", "#upload-link", function() {
                    var data = $(this),
                        detail = $(monster.template(self, "upload", {
                            metadata: data
                        }));
                    detail.find(".cancel-link").on("click", function() {
                        edit.dialog("close").remove()

                    });
                    var edit = monster.ui.dialog(detail, {
                        title: self.i18n.active().currencies.uploadDialog.popupTitle,
                        position: ["center", 20]
                    });
                }),
                // delete entry
                container.on("click", "#delete-currencies-link", function() {
                    var data = $(this);
                        var checkedValues = $("input:checkbox:checked", "#currencies_grid").map(function() {
                            return $(this).val();
                        }).get(); delete checkedValues['on'];
                        $.each(checkedValues, function(i, id) {
                                var entry = {};
                                entry.id = encodeURIComponent(id);
                                self.currenciesDelete(entry, function(data) {
                                });
                        });
                        if(checkedValues.length > 0) {
                            self.currenciesRender();
                            toastr.success(monster.template(self, '!' + self.i18n.active().currencies.deleteSuccess ))
                        }
                }),
                // add entry
                container.on("click", "#add-currencies-link", function() {
                    var data = $(this),
                        sList = {};
                        $.each(['id','name', 'rate', 'sign'], function(i, v) {
                                sList[v] = {
                                    name: 'metadata.' + v,
                                    id: 'metadata.'+ v,
                                    key: 'metadata.' + v,
                                    value: '',
                                    label: self.i18n.active().currencies.tableTitles[v],
                                    type: self.getcurrencieType(v)
                                }
                        });
                        detail = $(monster.template(self, "currencies-edit", {
                            metadata: '',
                            editlist: sList
                        }));
                    detail.find("#cancel").on("click", function() {
                        edit.dialog("close").remove()

                    }), detail.find("#book-detail-add").on("click", function() {
                        var formData = monster.ui.getFormData('currencies_detail_dialog');
                        self.currenciesAdd(formData.metadata, function(data) {
                                toastr.success(monster.template(self, '!' + self.i18n.active().currencies.addSuccess + data.id ));
                                self.currenciesRender();
                                edit.dialog('close').remove();
                        });
                    });
                    flags.populateDropdown(detail.find('#metadata_country'), 'inherit', {inherit: ''});
                    detail.find('#metadata_country').chosenImage({ search_contains: true, width: '220px' });
                    var edit = monster.ui.dialog(detail, {
                        title: self.i18n.active().currencies.detailDialog.popupTitle,
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
                                    label: self.i18n.active().currencies.tableTitles[i],
                                    type: self.getcurrencieType(i)
                                }
                        });
                        detail = $(monster.template(self, "currencies-edit", {
                            metadata: sData,
                            editlist: sList
                        }));
                    detail.find("#cancel").on("click", function() {
                        edit.dialog("close").remove()
                    }), detail.find("#book-detail-delete").on("click", function() {
                        var formData = monster.ui.getFormData('currencies_detail_dialog');
                        formData.metadata.id = encodeURIComponent(formData.metadata.id);
                        self.currenciesDelete(formData.metadata, function(data) {
                                self.currenciesRender();
                                edit.dialog('close').remove();
                                toastr.success(monster.template(self, '!' + self.i18n.active().currencies.deleteSuccess + data.id ));
                        });

                    }), detail.find("#book-detail-update").on("click", function() {
                        var formData = monster.ui.getFormData('currencies_detail_dialog');
                        formData.metadata.id = encodeURIComponent(formData.metadata.id);
                        self.currenciesUpdate(formData.metadata, function(data) {
                                self.currenciesRender();
                                edit.dialog('close').remove();
                                toastr.success(monster.template(self, '!' + self.i18n.active().currencies.addSuccess + data.id ));
                        });
                    }),
                    flags.populateDropdown(detail.find('#metadata_country'), self.appFlags.tableData[row][1]||'inherit', {inherit: ''});
                    detail.find('#metadata_country').chosenImage({ search_contains: true, width: '220px' });
                    var edit = monster.ui.dialog(detail, {
                        title: self.i18n.active().currencies.detailDialog.popupTitle,
                        position: ["center", 20]
                    });
                })
            }, getcurrencieType: function(idx) {
                switch (idx) {
//                    case 'id': return "hidden"; break; 
                    case 'carrierid': return "select"; break; 
                    case 'direction': return "select"; break; 
                    case 'flatrate': return "select"; break; 
                    default: return "text";
                }
            }, currenciesInitTable: function(template, func) {
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
                        sTitle: self.i18n.active().currencies.tableTitles.id,
                    }, {
                        sTitle: self.i18n.active().currencies.tableTitles.name
                    }, {
                        sTitle: self.i18n.active().currencies.tableTitles.sign
                    }, {
                        sTitle: self.i18n.active().currencies.tableTitles.rate
                    }, {
                        sTitle: self.i18n.active().currencies.tableTitles.action,
                        bSortable: false,
                        fnRender: function(data) {
                            return '<a href="#" class="detail-link monster-link blue" data-row="' + data.iDataRow +'"><i class="fa fa-edit"></i></a>'
                        }
                    }, {
                        bVisible: !1
                    }];
                self.currenciesGetData(function(data) {
//                    console.log(data),
                    monster.ui.table.create("currencies", template.find("#currencies_grid"), table, data, {
                        sDom: '<"actions_currencies">frtlip',
                        aaSorting: [
                            [3, "asc"]
                        ]
                }),
                $.fn.dataTableExt.afnFiltering.pop(),func && func(),
                $("div.actions_currencies", template).html('</button><button id="add-currencies-link" class="monster-button monster-button-success" data-action="addd">' +
                self.i18n.active().currencies.add +  '</button><button id="delete-currencies-link" class="monster-button monster-button-danger" data-action="deleted">' +
                self.i18n.active().currencies.delete + '</button><button id="upload-link" type="button" class="monster-button monster-button-success upload-action'+
                ' upload-submit"><i class="fa fa-upload"></i></button>'),
                $('#select_all_bookentrys').click(function (e) {
                    $(this).closest('table').find('td input:checkbox').prop('checked', this.checked);
                });
            })
            },
            currenciesFormatDataTable: function(data) {
                var ret = [];
                return $.each(data, function() {
                    ret.push(['', this.prefix.substring(0,2)||'', this.carrierid||'', this.rate_name||'', this.prefix||'', this.rate_cost||'', this||'', this.id||''])
                }), ret
            },
            currenciesGetData: function(callback) {
                var self = this;
                self.callApi({
                    resource: "currencies.list",
                    data: {
                        accountId: self.accountId,
                        filters: { paginate:false }
                    },
                    success: function(data) {
                        var ret = self.currenciesFormatDataTable(data.data);
                        self.appFlags.tableData = ret, callback && callback(ret)
                    }
                })
            },
            currenciesAdd: function(data, callback){
                    var self = this;
                    self.callApi({
                            resource: 'currencies.create',
                            data: {
                                    accountId: self.accountId,
                                    data: data
                            },
                            success: function(data) {
                                    callback(data.data);
                            }
                    });
            },

            currenciesUpdate: function(data, callback){
                    var self = this;
                    self.callApi({
                            resource: 'currencies.update',
                            data: {
                                    accountId: self.accountId,
                                    data: data
                            },
                            success: function(data) {
                                    callback && callback(data.data);
                            }
                    });
            },

            currenciesDelete: function(data, callback){
                    var self = this;
                    self.callApi({
                            resource: 'currencies.delete',
                            data: {
                                    accountId: self.accountId,
                                    currenciesId: data.id,
                                    data: {}

                            },
                            success: function(data) {
                                    callback && callback(data.data);
                            }
                    });
            },

        };
    return app
});