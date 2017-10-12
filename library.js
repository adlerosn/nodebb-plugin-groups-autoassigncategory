"use strict";

var async = require('async');
var rewire = require('rewire');
var getGroupNames = rewire('../../src/controllers/admin/groups').__get__('getGroupNames');

var db = module.parent.require('./database');
var meta = module.parent.require('./meta');
var groups = module.parent.require('./groups');
var categories = module.parent.require('./categories');
var privileges = module.parent.require('./privileges');
var controllers = require('./lib/controllers');
var plugin = {};

plugin.init = function(params, callback) {
    var router = params.router,
    hostMiddleware = params.middleware,
    hostControllers = params.controllers;

    // We create two routes for every view. One API call, and the actual route itself.
    // Just add the buildHeader middleware to your route and NodeBB will take care of everything for you.

    router.get('/admin/plugins/groupcategories', hostMiddleware.admin.buildHeader, controllers.renderAdminPage);
    router.get('/api/admin/plugins/groupcategories', controllers.renderAdminPage);

    callback();

    meta.settings.get('groupcategories', function(nil, configdata){
        plugin.config = configdata;
        plugin.updateAllGroups(function(){});
    });
};

plugin.updateAllGroups = function(callback){
    plugin.listGroups(function(err, groups){
        for(var gp in groups){
            plugin.updateGroup(groups[gp], callback);
        }
    });
}

plugin.listGroups = function(callback){
    async.waterfall([
        function (next) {
            getGroupNames(next);
        },
        function (groupNames, next) {
            groups.getGroupsData(groupNames, next);
        },
    ],callback);
}

plugin.addAdminNavigation = function(header, callback) {
    header.plugins.push({
        route: '/plugins/groupcategories',
        icon: 'fa-users',
        name: 'Groups\' categories'
    });

    callback(null, header);
};

plugin.updateGroup = function(group, callback, action) {
    var createCategoryForGroup = function(err, cid) {
        var expectedCategoryData = {
            name: group.name,
            description: group.description,
            slug: group.slug,
            parentCid: plugin.config.category,
            icon: group.icon,
            bgColor: group.labelColor,
            color: '#FFFFFF',
        };
        if(!group.icon && group['cover:thumb:url']){
            expectedCategoryData.image = group['cover:thumb:url'];
            expectedCategoryData.backgroundImage = group['cover:thumb:url'];
            expectedCategoryData.imageClass = 'contain';
        }else{
            expectedCategoryData.image = '';
            expectedCategoryData.backgroundImage = '';
            expectedCategoryData.imageClass = 'cover';
        }
        if(action==='delete'){
            expectedCategoryData.disabled = 1;
        }
        if(err || !cid){
            categories.create(expectedCategoryData, function(err, category){
                db.setObjectField('groupname:cid', group.name, category.cid);
            });
        }else{
            expectedCategoryData['slug'] = undefined;
            categories.getCategoryById({cid:cid}, function(err, category){
                if(typeof(category)==='undefined'){
                    db.deleteObjectField('groupname:cid', group.name, function(){
                        createCategoryForGroup(null, null);
                    });
                    return;
                }
                if(category.disabled){
                    return;
                }
                var categoryNeedsUpdate = false;
                for(var key in expectedCategoryData){
                    if(expectedCategoryData[key] != category[key]){
                        category[key] = expectedCategoryData[key];
                        categoryNeedsUpdate = true;
                    }
                }
                if(categoryNeedsUpdate){
                    category.tagWhitelist = '';
                    var catUpd = {};
                    catUpd[cid] = category;
                    categories.update(catUpd,function(err){})
                }
                var upl = privileges.userPrivilegeList
                var guestPermLvl = 2;
                for(var ppos in upl){
                    groups[(ppos<guestPermLvl)?'join':'leave']('cid:' + cid + ':privileges:groups:' + upl[ppos], 'guests', function(){});
                }
                if(!group.private){guestPermLvl++};
                for(var ppos in upl){
                    groups[(ppos<guestPermLvl)?'join':'leave']('cid:' + cid + ':privileges:groups:' + upl[ppos], 'registered-users', function(){});
                }
                for(var ppos in upl){
                    groups[(ppos<10)?'join':'leave']('cid:' + cid + ':privileges:groups:' + upl[ppos], group.name, function(){});
                }
            })
        }
    }
    db.getObjectField('groupname:cid', group.name, createCategoryForGroup);

    callback(null, group);
}

plugin.destroyGroup = function(data, callback){
    db.getObjectField('groupname:cid', data.group.name, function(err, cid) {
        if(cid){
            var catUpd = {};
            catUpd[cid] = {disabled:1};
            categories.update(catUpd,function(err){});
        }
    });
}

plugin.createGroup = function(data){
    if(data && data.group && !data.group.system && !data.group.hidden){
        plugin.updateAllGroups(function(){});
    }
}

plugin.editGroup = function(data){
    plugin.createGroup({group:data.values});
}

plugin.renameGroup = function(data){
    db.getObjectField('groupname:cid', data.old, function(err, cid) {
        if(cid){
            db.deleteObjectField('groupname:cid', data.old, function(){
                db.setObjectField('groupname:cid', data.new, cid);
            });
        }
    });
}

module.exports = plugin;
