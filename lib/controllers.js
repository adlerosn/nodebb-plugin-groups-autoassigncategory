'use strict';

var	async = module.parent.parent.require('async');
var categories = module.parent.parent.require('./categories');
var db = module.parent.parent.require('./database');

var Controllers = {};

Controllers.renderAdminPage = function (req, res, next) {
    /*
    Make sure the route matches your path to template exactly.

    If your route was:
    myforum.com/some/complex/route/
    your template should be:
    templates/some/complex/route.tpl
    and you would render it like so:
    res.render('some/complex/route');
    */
    async.waterfall([
        async.apply(db.getSortedSetRange, 'categories:cid', 0, -1),
        function(cids, next) {
            categories.getCategoriesFields(cids, ['cid', 'name', 'order', 'parentCid'], next);
        }
    ], function(err, data) {
        data.sort(function(a,b){
            if(a.parentCid!=b.parentCid){
                return a.parentCid-b.parentCid;
            };
            return a.order-b.order;
        });
        res.render('admin/plugins/groupcategories', {
            categories: data
        });
    });
};

module.exports = Controllers;
