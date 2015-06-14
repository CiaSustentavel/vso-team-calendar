/// <reference path='../../ref/VSS/VSS.d.ts' />
define(["require", "exports", "Calendar/Utils/Date", "q", "VSS/Service", "VSS/Utils/Date", "VSS/Utils/String", "VSS/WebApi/Constants", "TFS/Work/RestClient"], function (require, exports, Calendar_DateUtils, Q, Service, Utils_Date, Utils_String, WebApi_Constants, Work_Client) {
    var VSOCapacityEventSource = (function () {
        function VSOCapacityEventSource() {
            this.id = "daysOff";
            this.name = "Days off";
            this.order = 30;
        }
        VSOCapacityEventSource.prototype.getEvents = function (query) {
            var _this = this;
            var result = [];
            var deferred = Q.defer();
            var capacityPromises = [];
            var iterationTeamDaysOffPromises = [];
            this._events = null;
            var webContext = VSS.getWebContext();
            var teamContext = { projectId: webContext.project.id, teamId: webContext.team.id, project: "", team: "" };
            var workClient = Service.VssConnection
                .getConnection()
                .getHttpClient(Work_Client.WorkHttpClient, WebApi_Constants.ServiceInstanceTypes.TFS);
            workClient.getTeamIterations(teamContext).then(function (iterations) {
                if (!iterations || iterations.length === 0) {
                    _this._events = result;
                    deferred.resolve(result);
                }
                iterations.forEach(function (iteration, index, array) {
                    iterationTeamDaysOffPromises.push(workClient.getTeamDaysOff(teamContext, iteration.id));
                    iterationTeamDaysOffPromises[iterationTeamDaysOffPromises.length - 1].then(function (teamDaysOff) {
                        if (teamDaysOff && teamDaysOff.daysOff && teamDaysOff.daysOff.length) {
                            teamDaysOff.daysOff.forEach(function (daysOffRange, i, array) {
                                var event = {};
                                event.startDate = Utils_Date.shiftToUTC(new Date(daysOffRange.start.valueOf()));
                                event.endDate = Utils_Date.shiftToUTC(new Date(daysOffRange.end.valueOf()));
                                event.title = "Team Day Off";
                                event.member = {
                                    displayName: webContext.team.name,
                                    id: webContext.team.id,
                                    imageUrl: _this._buildTeamImageUrl(webContext.host.uri, webContext.team.id)
                                };
                                event.category = "DaysOff";
                                result.push(event);
                            });
                        }
                    });
                    capacityPromises.push(workClient.getCapacities(teamContext, iteration.id));
                    capacityPromises[capacityPromises.length - 1].then(function (capacities) {
                        if (capacities && capacities.length) {
                            for (var i = 0, l = capacities.length; i < l; i++) {
                                var capacity = capacities[i];
                                capacity.daysOff.forEach(function (daysOffRange, i, array) {
                                    var event = {};
                                    event.startDate = Utils_Date.shiftToUTC(new Date(daysOffRange.start.valueOf()));
                                    event.endDate = Utils_Date.shiftToUTC(new Date(daysOffRange.end.valueOf()));
                                    event.title = capacity.teamMember.displayName + " Day Off";
                                    event.member = capacity.teamMember;
                                    event.category = "DaysOff";
                                    result.push(event);
                                });
                            }
                        }
                        return result;
                    });
                    Q.all(iterationTeamDaysOffPromises).then(function () {
                        Q.all(capacityPromises).then(function () {
                            _this._events = result;
                            deferred.resolve(result);
                        });
                    }, function (e) {
                        deferred.reject(e);
                    });
                });
            }, function (e) {
                deferred.reject(e);
            });
            return deferred.promise;
        };
        VSOCapacityEventSource.prototype.getCategories = function (query) {
            var _this = this;
            var deferred = Q.defer();
            if (this._events) {
                deferred.resolve(this._getCategoryData(this._events.slice(0), query));
            }
            else {
                this.getEvents().then(function (events) {
                    deferred.resolve(_this._getCategoryData(events, query));
                });
            }
            return deferred.promise;
        };
        VSOCapacityEventSource.prototype.addEvents = function (events) {
            var _this = this;
            this._events = null;
            var deferred = Q.defer();
            var dayOffStart = events[0].startDate;
            var dayOffEnd = events[0].endDate;
            var isTeam = events[0].member.displayName === "Everyone";
            var memberId = events[0].member.id;
            var webContext = VSS.getWebContext();
            var teamContext = { projectId: webContext.project.id, teamId: webContext.team.id, project: "", team: "" };
            var workClient = Service.VssConnection
                .getConnection()
                .getHttpClient(Work_Client.WorkHttpClient, WebApi_Constants.ServiceInstanceTypes.TFS);
            Calendar_DateUtils.getIterationId(dayOffStart).then(function (iterationId) {
                if (isTeam) {
                    _this._getTeamDaysOff(workClient, teamContext, iterationId).then(function (teamDaysOff) {
                        var teamDaysOffPatch = { daysOff: teamDaysOff.daysOff };
                        teamDaysOffPatch.daysOff.push({ start: dayOffStart, end: dayOffEnd });
                        workClient.updateTeamDaysOff(teamDaysOffPatch, teamContext, iterationId).then(function (value) {
                            deferred.resolve(events[0]);
                        });
                    });
                }
                else {
                    _this._getCapacity(workClient, teamContext, iterationId, memberId).then(function (capacity) {
                        var capacityPatch = { activities: capacity.activities, daysOff: capacity.daysOff };
                        capacityPatch.daysOff.push({ start: dayOffStart, end: dayOffEnd });
                        workClient.updateCapacity(capacityPatch, teamContext, iterationId, memberId).then(function (value) {
                            deferred.resolve(events[0]);
                        });
                    });
                }
            });
            return deferred.promise;
        };
        VSOCapacityEventSource.prototype.removeEvents = function (events) {
            var _this = this;
            this._events = null;
            var deferred = Q.defer();
            var dayOffStart = Utils_Date.shiftToUTC(events[0].startDate);
            var memberId = events[0].member.id;
            var isTeam = events[0].member.uniqueName === undefined;
            var webContext = VSS.getWebContext();
            var teamContext = { projectId: webContext.project.id, teamId: webContext.team.id, project: "", team: "" };
            var workClient = Service.VssConnection
                .getConnection()
                .getHttpClient(Work_Client.WorkHttpClient, WebApi_Constants.ServiceInstanceTypes.TFS);
            Calendar_DateUtils.getIterationId(dayOffStart).then(function (iterationId) {
                if (isTeam) {
                    _this._getTeamDaysOff(workClient, teamContext, iterationId).then(function (teamDaysOff) {
                        var teamDaysOffPatch = { daysOff: teamDaysOff.daysOff };
                        teamDaysOffPatch.daysOff.some(function (dateRange, index, array) {
                            if (dateRange.start.valueOf() === dayOffStart.valueOf()) {
                                teamDaysOffPatch.daysOff.splice(index, 1);
                                return true;
                            }
                            return false;
                        });
                        workClient.updateTeamDaysOff(teamDaysOffPatch, teamContext, iterationId).then(function (value) {
                            deferred.resolve(events[0]);
                        });
                    });
                }
                else {
                    _this._getCapacity(workClient, teamContext, iterationId, memberId).then(function (capacity) {
                        var capacityPatch = { activities: capacity.activities, daysOff: capacity.daysOff };
                        capacityPatch.daysOff.some(function (dateRange, index, array) {
                            if (dateRange.start.valueOf() === dayOffStart.valueOf()) {
                                capacityPatch.daysOff.splice(index, 1);
                                return true;
                            }
                            return false;
                        });
                        workClient.updateCapacity(capacityPatch, teamContext, iterationId, memberId).then(function (value) {
                            deferred.resolve(events[0]);
                        });
                    });
                }
            });
            return deferred.promise;
        };
        VSOCapacityEventSource.prototype.updateEvents = function (events) {
            var _this = this;
            this._events = null;
            var deferred = Q.defer();
            var dayOffStart = events[0].startDate;
            var dayOffEnd = events[0].endDate;
            var memberId = events[0].member.id;
            var isTeam = events[0].member.uniqueName === undefined;
            var webContext = VSS.getWebContext();
            var teamContext = { projectId: webContext.project.id, teamId: webContext.team.id, project: "", team: "" };
            var workClient = Service.VssConnection
                .getConnection()
                .getHttpClient(Work_Client.WorkHttpClient, WebApi_Constants.ServiceInstanceTypes.TFS);
            Calendar_DateUtils.getIterationId(dayOffStart).then(function (iterationId) {
                if (isTeam) {
                    _this._getTeamDaysOff(workClient, teamContext, iterationId).then(function (teamDaysOff) {
                        var teamDaysOffPatch = { daysOff: teamDaysOff.daysOff };
                        var updated = teamDaysOffPatch.daysOff.some(function (dateRange, index, array) {
                            if (dateRange.start.valueOf() === dayOffStart.valueOf()) {
                                teamDaysOffPatch.daysOff[index].end = dayOffEnd;
                                return true;
                            }
                            if (dateRange.end.valueOf() === dayOffEnd.valueOf()) {
                                teamDaysOffPatch.daysOff[index].start = dayOffStart;
                                return true;
                            }
                            return false;
                        });
                        workClient.updateTeamDaysOff(teamDaysOffPatch, teamContext, iterationId).then(function (value) {
                            deferred.resolve(events[0]);
                        });
                    });
                }
                else {
                    _this._getCapacity(workClient, teamContext, iterationId, memberId).then(function (capacity) {
                        var capacityPatch = { activities: capacity.activities, daysOff: capacity.daysOff };
                        capacityPatch.daysOff.some(function (dateRange, index, array) {
                            if (dateRange.start.valueOf() === dayOffStart.valueOf()) {
                                capacityPatch.daysOff[index].end = dayOffEnd;
                                return true;
                            }
                            if (dateRange.end.valueOf() === dayOffEnd.valueOf()) {
                                capacityPatch.daysOff[index].start = dayOffStart;
                                return true;
                            }
                            return false;
                        });
                        workClient.updateCapacity(capacityPatch, teamContext, iterationId, memberId).then(function (value) {
                            deferred.resolve(events[0]);
                        });
                    });
                }
            });
            return deferred.promise;
        };
        VSOCapacityEventSource.prototype._getTeamDaysOff = function (workClient, teamContext, iterationId) {
            var deferred = Q.defer();
            workClient.getTeamDaysOff(teamContext, iterationId).then(function (value) {
                deferred.resolve(value);
            });
            return deferred.promise;
        };
        VSOCapacityEventSource.prototype._getCapacity = function (workClient, teamContext, iterationId, memberId) {
            var deferred = Q.defer();
            workClient.getCapacity(teamContext, iterationId, memberId).then(function (value) {
                deferred.resolve(value);
            });
            return deferred.promise;
        };
        VSOCapacityEventSource.prototype._getCategoryData = function (events, query) {
            var memberMap = {};
            var categories = [];
            $.each(events, function (index, event) {
                if (Calendar_DateUtils.eventIn(event, query)) {
                    var member = event.member;
                    if (!memberMap[member.id]) {
                        memberMap[member.id] = true;
                        categories.push({
                            title: member.displayName,
                            imageUrl: member.imageUrl
                        });
                    }
                }
            });
            return categories;
        };
        VSOCapacityEventSource.prototype._buildTeamImageUrl = function (hostUri, id) {
            return Utils_String.format("{0}_api/_common/IdentityImage?id={1}", hostUri, id);
        };
        return VSOCapacityEventSource;
    })();
    exports.VSOCapacityEventSource = VSOCapacityEventSource;
});

//# sourceMappingURL=../../Calendar/EventSources/VSOCapacityEventSource.js.map