define(["require", "exports", "Calendar/Views"], function (require, exports, Calendar_Views) {
    $(function () {
        Calendar_Views.CalendarView.enhance(Calendar_Views.CalendarView, $(".calendar-view"));
        Calendar_Views.SummaryView.enhance(Calendar_Views.SummaryView, $(".summary-view"));
    });
});
