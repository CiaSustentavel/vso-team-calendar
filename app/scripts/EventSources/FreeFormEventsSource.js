/// <reference path='../ref/VSS/VSS.d.ts' />
define(["require", "exports", "Calendar/Utils/Date", "Calendar/Utils/Color", "VSS/Common/Contracts/Platform", "VSS/Contributions/RestClient", "q", "VSS/Service", "VSS/Utils/String", "VSS/WebApi/Constants"], function (require, exports, Calendar_DateUtils, Calendar_ColorUtils, Contracts_Platform, Contributions_RestClient, Q, Service, Utils_String, WebApi_Constants) {
    var FreeFormEventsSource = (function () {
        function FreeFormEventsSource() {
            this.id = "freeForm";
            this.name = "Events";
            this.order = 10;
            var webContext = VSS.getWebContext();
            this._teamId = webContext.team.id;
        }
        FreeFormEventsSource.prototype.getEvents = function (query) {
            return this._beginGetExtensionSetting();
        };
        FreeFormEventsSource.prototype.getCategories = function (query) {
            var _this = this;
            return this.getEvents().then(function (events) {
                return _this._categorizeEvents(events, query);
            });
        };
        FreeFormEventsSource.prototype.addEvents = function (events) {
            var _this = this;
            var deferred = Q.defer();
            this._beginGetExtensionSetting().then(function () {
                events.forEach(function (calendarEvent, index, array) {
                    _this._events.push(calendarEvent);
                });
                _this._beginUpdateExtensionSetting().then(deferred.resolve, deferred.reject);
            });
            return deferred.promise;
        };
        FreeFormEventsSource.prototype.removeEvents = function (events) {
            var _this = this;
            var deferred = Q.defer();
            this._beginGetExtensionSetting().then(function () {
                events.forEach(function (calendarEvent, index, array) {
                    var eventInArray = $.grep(_this._events, function (e) { return e.eventId === calendarEvent.eventId; })[0];
                    var index = _this._events.indexOf(eventInArray);
                    if (index > -1) {
                        _this._events.splice(index, 1);
                    }
                });
                _this._beginUpdateExtensionSetting().then(deferred.resolve, deferred.reject);
            });
            return deferred.promise;
        };
        FreeFormEventsSource.prototype.updateEvents = function (events) {
            var _this = this;
            var deferred = Q.defer();
            this._beginGetExtensionSetting().then(function () {
                events.forEach(function (calendarEvent, index, array) {
                    var eventInArray = $.grep(_this._events, function (e) { return e.eventId === calendarEvent.eventId; })[0];
                    var index = _this._events.indexOf(eventInArray);
                    if (index > -1) {
                        _this._events.splice(index, 1, calendarEvent);
                    }
                });
                _this._beginUpdateExtensionSetting().then(deferred.resolve, deferred.reject);
            });
            return deferred.promise;
        };
        FreeFormEventsSource.prototype._beginGetExtensionSetting = function () {
            var _this = this;
            var deferred = Q.defer();
            var contributionsClient = Service.VssConnection
                .getConnection(null, Contracts_Platform.ContextHostType.Application)
                .getHttpClient(Contributions_RestClient.ContributionsHttpClient, WebApi_Constants.ServiceInstanceTypes.TFS);
            contributionsClient.getAppData(VSS.getExtensionContext().id, this._teamId).then(function (ExtensionSetting) {
                _this._events = _this._extensionSettingToEvents(ExtensionSetting.value);
                deferred.resolve(_this._events);
            }, function (e) {
                deferred.reject(e);
            });
            return deferred.promise;
        };
        FreeFormEventsSource.prototype._beginUpdateExtensionSetting = function () {
            var _this = this;
            var deferred = Q.defer();
            var ExtensionSetting = this._eventsToExtensionSetting();
            var contributionsClient = Service.VssConnection
                .getConnection(null, Contracts_Platform.ContextHostType.Application)
                .getHttpClient(Contributions_RestClient.ContributionsHttpClient, WebApi_Constants.ServiceInstanceTypes.TFS);
            contributionsClient.updateAppData(ExtensionSetting, VSS.getExtensionContext().id, this._teamId).then(function (ExtensionSetting) {
                _this._events = _this._extensionSettingToEvents(ExtensionSetting.value);
                deferred.resolve(_this._events);
            }, function (e) {
                deferred.reject(e);
            });
            return deferred.promise;
        };
        FreeFormEventsSource.prototype._eventsToExtensionSetting = function () {
            var ExtensionSettingValue = JSON.stringify({
                'events': this._events
            });
            var ExtensionSetting = {
                'key': this._teamId,
                'value': ExtensionSettingValue
            };
            return ExtensionSetting;
        };
        FreeFormEventsSource.prototype._extensionSettingToEvents = function (ExtensionSettingValue) {
            if (ExtensionSettingValue) {
                var json = JSON.parse(ExtensionSettingValue);
                return json.events ? json.events : [];
            }
            return [];
        };
        FreeFormEventsSource.prototype._categorizeEvents = function (events, query) {
            var categories = [];
            var categoryMap = {};
            var countMap = {};
            $.each(events || [], function (index, event) {
                var name = (event.category || "uncategorized").toLocaleLowerCase();
                if (Calendar_DateUtils.eventIn(event, query)) {
                    var count = 0;
                    if (!categoryMap[name]) {
                        categoryMap[name] = {
                            title: name,
                            subTitle: "",
                            color: Calendar_ColorUtils.generateColor(name)
                        };
                        categories.push(categoryMap[name]);
                        countMap[name] = 0;
                    }
                    count = countMap[name] + 1;
                    if (count === 1) {
                        categoryMap[name].subTitle = event.title;
                    }
                    else {
                        categoryMap[name].subTitle = Utils_String.format("{0} event{1}", count, count > 1 ? "s" : "");
                    }
                    countMap[name] = count;
                }
            });
            return categories;
        };
        return FreeFormEventsSource;
    })();
    exports.FreeFormEventsSource = FreeFormEventsSource;
});
