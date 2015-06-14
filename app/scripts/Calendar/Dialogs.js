/// <reference path='../ref/VSS/VSS.d.ts' />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "VSS/Controls", "VSS/Controls/Common", "VSS/Controls/Validation", "VSS/Utils/Date", "VSS/Utils/UI"], function (require, exports, Controls, Controls_Common, Controls_Validation, Utils_Date, Utils_UI) {
    var domElem = Utils_UI.domElem;
    var EditEventDialog = (function (_super) {
        __extends(EditEventDialog, _super);
        function EditEventDialog() {
            _super.apply(this, arguments);
        }
        EditEventDialog.prototype.initializeOptions = function (options) {
            _super.prototype.initializeOptions.call(this, $.extend(options, { "height": 250 }));
        };
        EditEventDialog.prototype.initialize = function () {
            this._calendarEvent = this._options.event;
            this._createLayout();
            _super.prototype.initialize.call(this);
        };
        EditEventDialog.prototype.getTitle = function () {
            return this._options.title;
        };
        EditEventDialog.prototype.onOkClick = function () {
            this._calendarEvent.startDate = this._parseDateValue(this._$startInput.val());
            this._calendarEvent.endDate = this._parseDateValue(this._$endInput.val());
            this._buildCalendarEventFromFields();
            this.processResult(this._calendarEvent);
        };
        EditEventDialog.prototype._buildCalendarEventFromFields = function () {
        };
        EditEventDialog.prototype._createLayout = function () {
            var _this = this;
            this._$container = $(domElem('div')).addClass('edit-event-container').appendTo(this._element);
            this._eventValidationError = Controls.BaseControl.createIn(Controls_Common.MessageAreaControl, this._$container, { closeable: false });
            var $editControl = $(domElem('div', 'event-edit-control'));
            var $fieldsContainer = $(domElem('table')).appendTo($editControl);
            this._$startInput = $("<input type='text' id='fieldStartDate' />").val(this._formatDateValue(this._calendarEvent.startDate))
                .on("blur", function (e) {
                _this.updateOkButton(_this._validate());
            });
            this._$endInput = $("<input type='text' id='fieldEndDate' />")
                .on("blur", function (e) {
                _this.updateOkButton(_this._validate());
            });
            if (this._calendarEvent.endDate) {
                this._$endInput.val(this._formatDateValue(this._calendarEvent.endDate));
            }
            else {
                this._$endInput.val(this._formatDateValue(this._calendarEvent.startDate));
            }
            var fields = this._getFormFields();
            for (var i = 0, l = fields.length; i < l; i += 1) {
                var labelName = fields[i][0];
                var field = fields[i][1];
                var $row = $(domElem("tr"));
                var fieldId = field.attr("id") || $("input", field).attr("id");
                $(domElem("label")).attr("for", fieldId).text(labelName).appendTo($(domElem("td", "label")).appendTo($row));
                field.appendTo($(domElem("td"))
                    .appendTo($row));
                $row.appendTo($fieldsContainer);
            }
            this._$container.append($editControl);
            var startCombo = Controls.Enhancement.enhance(Controls_Common.Combo, this._$startInput, {
                type: "date-time"
            });
            var endCombo = Controls.Enhancement.enhance(Controls_Common.Combo, this._$endInput, {
                type: "date-time"
            });
            this._setupValidators(this._$startInput, "Start date must be a valid date");
            this._setupValidators(this._$endInput, "End date must be a valid date", "End date must be equal to or after start date", this._$startInput, 0);
        };
        EditEventDialog.prototype._setupValidators = function ($field, validDateFormatMessage, relativeToErrorMessage, $relativeToField, dateComparisonOptions) {
            Controls.Enhancement.enhance(Controls_Validation.DateValidator, $field, {
                invalidCssClass: "date-invalid",
                group: "default",
                message: validDateFormatMessage
            });
            if (relativeToErrorMessage) {
                Controls.Enhancement.enhance(DateRelativeToValidator, $field, {
                    comparison: dateComparisonOptions,
                    relativeToField: $relativeToField,
                    group: "default",
                    message: relativeToErrorMessage
                });
            }
        };
        EditEventDialog.prototype._getFormFields = function () {
            var fields = [];
            return fields;
        };
        EditEventDialog.prototype._validate = function () {
            return true;
        };
        EditEventDialog.prototype._formatDateValue = function (date) {
            return date === null ? "" : Utils_Date.format(new Date(date.valueOf()), "d");
        };
        EditEventDialog.prototype._parseDateValue = function (date) {
            return date === null ? null : Utils_Date.parseDateString(date, "d", true);
        };
        EditEventDialog.prototype._setError = function (errorMessage) {
            this._eventValidationError.setError($("<span />").html(errorMessage));
        };
        EditEventDialog.prototype._clearError = function () {
            this._eventValidationError.clear();
        };
        return EditEventDialog;
    })(Controls_Common.ModalDialog);
    exports.EditEventDialog = EditEventDialog;
    var EditFreeFormEventDialog = (function (_super) {
        __extends(EditFreeFormEventDialog, _super);
        function EditFreeFormEventDialog() {
            _super.apply(this, arguments);
        }
        EditFreeFormEventDialog.prototype.initialize = function () {
            _super.prototype.initialize.call(this);
            if (this._calendarEvent.title) {
                this._$titleInput.val(this._calendarEvent.title);
                this.updateOkButton(true);
            }
            this._$categoryInput.val(this._calendarEvent.category || "");
        };
        EditFreeFormEventDialog.prototype._buildCalendarEventFromFields = function () {
            this._calendarEvent.title = $.trim(this._$titleInput.val());
            this._calendarEvent.category = $.trim(this._$categoryInput.val());
        };
        EditFreeFormEventDialog.prototype._createLayout = function () {
            var _this = this;
            this._$titleInput = $("<input type='text' class='requiredInfoLight' id='fieldTitle'/>")
                .on("input keyup", function (e) {
                if (e.keyCode !== Utils_UI.KeyCode.ENTER) {
                    _this.updateOkButton(_this._validate());
                }
            });
            this._$categoryInput = $("<input type='text' id='fieldCategory' />");
            var categories = this._options.categories;
            if (categories) {
                categories.then(function (allCategories) {
                    Controls.Enhancement.enhance(Controls_Common.Combo, _this._$categoryInput, {
                        source: allCategories,
                        dropCount: 3
                    });
                });
            }
            _super.prototype._createLayout.call(this);
        };
        EditFreeFormEventDialog.prototype._getFormFields = function () {
            var fields = [];
            fields.push(["Title", this._$titleInput]);
            fields.push(["Start Date", this._$startInput]);
            fields.push(["End Date", this._$endInput]);
            fields.push(["Category", this._$categoryInput]);
            return fields;
        };
        EditFreeFormEventDialog.prototype._validate = function () {
            var title = $.trim(this._$titleInput.val());
            if (title.length <= 0) {
                this._clearError();
                return false;
            }
            var validationResult = [];
            var isValid = Controls_Validation.validateGroup('default', validationResult);
            if (!isValid) {
                this._setError(validationResult[0].getMessage());
                return false;
            }
            this._clearError();
            return true;
        };
        return EditFreeFormEventDialog;
    })(EditEventDialog);
    exports.EditFreeFormEventDialog = EditFreeFormEventDialog;
    var EditCapacityEventDialog = (function (_super) {
        __extends(EditCapacityEventDialog, _super);
        function EditCapacityEventDialog() {
            _super.apply(this, arguments);
        }
        EditCapacityEventDialog.prototype.initialize = function () {
            _super.prototype.initialize.call(this);
            this._$memberInput.val(this._calendarEvent.member.displayName || "");
            if (this._options.isEdit) {
                this._$memberInput.addClass('requiredInfoLight');
                this._$memberInput.prop('disabled', true);
            }
            this.updateOkButton(true);
        };
        EditCapacityEventDialog.prototype._buildCalendarEventFromFields = function () {
            if (this._members) {
                var displayName = $.trim(this._$memberInput.val());
                var eventMember;
                if (displayName === EditCapacityEventDialog.EVERYONE) {
                    this._calendarEvent.member.displayName = displayName;
                }
                else {
                    this._members.some(function (member, index, array) {
                        if (member.displayName === displayName) {
                            eventMember = member;
                            return true;
                        }
                        return false;
                    });
                    this._calendarEvent.member = eventMember;
                }
            }
        };
        EditCapacityEventDialog.prototype._createLayout = function () {
            var _this = this;
            this._$memberInput = $("<input type='text' id='fieldMember' />");
            if (this._options.membersPromise) {
                this._options.membersPromise.then(function (members) {
                    _this._members = members;
                    var memberNames = [];
                    memberNames.push(EditCapacityEventDialog.EVERYONE);
                    members.sort(function (a, b) { return a.displayName.toLocaleLowerCase().localeCompare(b.displayName.toLocaleLowerCase()); });
                    members.forEach(function (member, index, array) {
                        memberNames.push(member.displayName);
                    });
                    _super.prototype._createLayout.call(_this);
                    Controls.Enhancement.enhance(Controls_Common.Combo, _this._$memberInput, {
                        source: memberNames,
                        dropCount: 3
                    });
                });
            }
            else {
                _super.prototype._createLayout.call(this);
                this._$memberInput.prop('disabled', true);
            }
        };
        EditCapacityEventDialog.prototype._getFormFields = function () {
            var fields = [];
            fields.push(["Start Date", this._$startInput]);
            fields.push(["End Date", this._$endInput]);
            fields.push(["Team Member", this._$memberInput]);
            return fields;
        };
        EditCapacityEventDialog.prototype._validate = function () {
            var validationResult = [];
            var isValid = Controls_Validation.validateGroup('default', validationResult);
            if (!isValid) {
                this._setError(validationResult[0].getMessage());
                return false;
            }
            this._clearError();
            return true;
        };
        EditCapacityEventDialog.EVERYONE = "Everyone";
        return EditCapacityEventDialog;
    })(EditEventDialog);
    exports.EditCapacityEventDialog = EditCapacityEventDialog;
    var DateRelativeToValidator = (function (_super) {
        __extends(DateRelativeToValidator, _super);
        function DateRelativeToValidator(options) {
            _super.call(this, options);
        }
        DateRelativeToValidator.prototype.initializeOptions = function (options) {
            _super.prototype.initializeOptions.call(this, $.extend({
                invalidCssClass: "date-relative-to-invalid"
            }, options));
        };
        DateRelativeToValidator.prototype.isValid = function () {
            var fieldText = $.trim(this.getValue()), relativeToFieldText = $.trim(this._options.relativeToField.val()), fieldDate, relativeToFieldDate, result = false;
            if (fieldText && relativeToFieldText) {
                fieldDate = Utils_Date.parseDateString(fieldText, this._options.parseFormat, true);
                relativeToFieldDate = Utils_Date.parseDateString(relativeToFieldText, this._options.parseFormat, true);
            }
            else {
                return true;
            }
            if ((fieldDate instanceof Date) && !isNaN(fieldDate) && relativeToFieldDate instanceof Date && !isNaN(relativeToFieldDate)) {
                if (this._options.comparison === 0) {
                    result = fieldDate >= relativeToFieldDate;
                }
                else {
                    result = fieldDate <= relativeToFieldDate;
                }
            }
            else {
                result = true;
            }
            return result;
        };
        DateRelativeToValidator.prototype.getMessage = function () {
            return this._options.message;
        };
        return DateRelativeToValidator;
    })(Controls_Validation.BaseValidator);
});

//# sourceMappingURL=../Calendar/Dialogs.js.map