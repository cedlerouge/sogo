/* -*- Mode: java; indent-tabs-mode: nil; c-basic-offset: 4 -*- */

/*
  Copyright (C) 2005 SKYRIX Software AG
 
  This file is part of OpenGroupware.org.
 
  OGo is free software; you can redistribute it and/or modify it under
  the terms of the GNU Lesser General Public License as published by the
  Free Software Foundation; either version 2, or (at your option) any
  later version.
 
  OGo is distributed in the hope that it will be useful, but WITHOUT ANY
  WARRANTY; without even the implied warranty of MERCHANTABILITY or
  FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public
  License for more details.
 
  You should have received a copy of the GNU Lesser General Public
  License along with OGo; see the file COPYING.  If not, write to the
  Free Software Foundation, 59 Temple Place - Suite 330, Boston, MA
  02111-1307, USA.
*/

var contactSelectorAction = 'calendars-contacts';
var AppointmentEditor = {
    attendeesMenu: null
};

function uixEarlierDate(date1, date2) {
    // can this be done in a sane way?
    if (date1.getYear()  < date2.getYear()) return date1;
    if (date1.getYear()  > date2.getYear()) return date2;
    // same year
    if (date1.getMonth() < date2.getMonth()) return date1;
    if (date1.getMonth() > date2.getMonth()) return date2;
    //   // same month
    if (date1.getDate() < date2.getDate()) return date1;
    if (date1.getDate() > date2.getDate()) return date2;
    // same day
    return null;
}

function validateAptEditor() {
    var e, startdate, enddate, tmpdate;

    e = $('summary');
    if (e.value.length == 0) {
        if (!confirm(labels.validate_notitle))
            return false;
    }

    e = $('startTime_date');
    if (e.value.length != 10) {
        alert(labels.validate_invalid_startdate);
        return false;
    }
    startdate = e.calendar.prs_date(e.value);
    if (startdate == null) {
        alert(labels.validate_invalid_startdate);
        return false;
    }
      
    e = $('endTime_date');
    if (e.value.length != 10) {
        alert(labels.validate_invalid_enddate);
        return false;
    }
    enddate = e.calendar.prs_date(e.value);
    if (enddate == null) {
        alert(labels.validate_invalid_enddate);
        return false;
    }
    tmpdate = uixEarlierDate(startdate, enddate);
    if (tmpdate == enddate) {
        alert(labels.validate_endbeforestart);
        return false;
    }
    else if (tmpdate == null /* means: same date */) {
        // TODO: check time
        var start, end;
    
        start = parseInt(document.forms[0]['startTime_time_hour'].value);
        end = parseInt(document.forms[0]['endTime_time_hour'].value);

        if (start > end) {
            alert(labels.validate_endbeforestart);
            return false;
        }
        else if (start == end) {
            start = parseInt(document.forms[0]['startTime_time_minute'].value);
            end = parseInt(document.forms[0]['endTime_time_minute'].value);
            if (start > end) {
                alert(labels.validate_endbeforestart);
                return false;
            }
        }
    }

    return true;
}

function onAttendeesMenuPrepareVisibility()
{
    var composeToUndecidedAttendees = $('composeToUndecidedAttendees');
    var attendeesStates = $('attendeesMenu').innerHTML;
  
    if (attendeesStates.indexOf("needs-action") < 0)
        composeToUndecidedAttendees.addClassName("disabled");
    else
        composeToUndecidedAttendees.removeClassName("disabled");
}

function onComposeToAllAttendees()
{
    var attendees = $$("DIV#attendeesMenu LI.attendee");
    var addresses = new Array();
    attendees.each(function(item) {
        var address = item.firstChild.nodeValue.trim() + " <" + item.readAttribute("email") + ">";
        addresses.push(address);
    });
    if (window.opener)
        window.opener.openMailTo(addresses.join(","));
}

function onComposeToUndecidedAttendees()
{
    if ($(this).hasClassName("disabled"))
        return;
 
    var attendees = $$("DIV#attendeesMenu LI.attendee.needs-action");
    var addresses = new Array();
    attendees.each(function(item) {
        var address = item.firstChild.nodeValue.trim() + " <" + item.readAttribute("email") + ">";
        addresses.push(address);
    });
    if (window.opener)
        window.opener.openMailTo(addresses.join(","));
}

function addContact(tag, fullContactName, contactId, contactName, contactEmail) {
    var uids = $('uixselector-participants-uidList');

    if (contactId)
        {
            var re = new RegExp("(^|,)" + contactId + "($|,)");

            if (!re.test(uids.value))
                {
                    if (uids.value.length > 0)
                        uids.value += ',' + contactId;
                    else
                        uids.value = contactId;

                    var names = $('uixselector-participants-display');
                    names.innerHTML += ('<li onmousedown="return false;"'
                                        + ' onclick="onRowClick(event);"><img src="'
                                        + ResourcesURL + '/abcard.png" />'
                                        + contactName + '</li>');
                }
        }

    return false;
}

function saveEvent(sender) {
    if (validateAptEditor()) {
        document.forms['editform'].attendees.value = Object.toJSON($(attendees));
        document.forms['editform'].submit();
    }

    return false;
}

function startDayAsShortString() {
    return $('startTime_date').valueAsShortDateString();
}

function endDayAsShortString() {
    return $('endTime_date').valueAsShortDateString();
}

function _getDate(which) {
    var date = window.timeWidgets[which]['date'].inputAsDate();
    date.setHours( window.timeWidgets[which]['hour'].value );
    date.setMinutes( window.timeWidgets[which]['minute'].value );

    return date;
}

function _getShadowDate(which) {
    var date = window.timeWidgets[which]['date'].getAttribute("shadow-value").asDate();
    var intValue = parseInt(window.timeWidgets[which]['hour'].getAttribute("shadow-value"));
    date.setHours(intValue);
    intValue = parseInt(window.timeWidgets[which]['minute'].getAttribute("shadow-value"));
    date.setMinutes(intValue);

    return date;
}

function getStartDate() {
    return this._getDate('start');
}

function getEndDate() {
    return this._getDate('end');
}

function getShadowStartDate() {
    return this._getShadowDate('start');
}

function getShadowEndDate() {
    return this._getShadowDate('end');
}

function _setDate(which, newDate) {
    window.timeWidgets[which]['date'].setInputAsDate(newDate);
    window.timeWidgets[which]['hour'].value = newDate.getHours();
    var minutes = newDate.getMinutes();
    if (minutes % 15)
        minutes += (15 - minutes % 15);
    window.timeWidgets[which]['minute'].value = minutes;
}

function setStartDate(newStartDate) {
    this._setDate('start', newStartDate);
}

function setEndDate(newEndDate) {
    this._setDate('end', newEndDate);
}

function onAdjustTime(event) {
    var endDate = window.getEndDate();
    var startDate = window.getStartDate();
  
    if ($(this).readAttribute("id").startsWith("start")) {
        // Start date was changed
        var delta = window.getShadowStartDate().valueOf() -
            startDate.valueOf();
        var newEndDate = new Date(endDate.valueOf() - delta);
        window.setEndDate(newEndDate);
    
        window.timeWidgets['end']['date'].updateShadowValue();
        window.timeWidgets['end']['hour'].updateShadowValue();
        window.timeWidgets['end']['minute'].updateShadowValue();
        window.timeWidgets['start']['date'].updateShadowValue();
        window.timeWidgets['start']['hour'].updateShadowValue();
        window.timeWidgets['start']['minute'].updateShadowValue();
    }
    else {
        // End date was changed
        var delta = endDate.valueOf() - startDate.valueOf();  
        if (delta < 0) {
            alert(labels.validate_endbeforestart);
            var oldEndDate = window.getShadowEndDate();
            window.setEndDate(oldEndDate);

            window.timeWidgets['end']['date'].updateShadowValue();
            window.timeWidgets['end']['hour'].updateShadowValue();
            window.timeWidgets['end']['minute'].updateShadowValue();
        }
    }
}

function onAllDayChanged(event) {
    for (var type in window.timeWidgets) {
        window.timeWidgets[type]['hour'].disabled = this.checked;
        window.timeWidgets[type]['minute'].disabled = this.checked;
    }
}

function initTimeWidgets(widgets) {
    this.timeWidgets = widgets;

    if (widgets['start']['date']) {
        widgets['start']['date'].observe("change", this.onAdjustTime, false);
        widgets['start']['hour'].observe("change", this.onAdjustTime, false);
        widgets['start']['minute'].observe("change", this.onAdjustTime, false);
    }

    if (widgets['end']['date']) {
        widgets['end']['date'].observe("change", this.onAdjustTime, false);
        widgets['end']['hour'].observe("change", this.onAdjustTime, false);
        widgets['end']['minute'].observe("change", this.onAdjustTime, false);
    }

    var allDayLabel = $("allDay");
    if (allDayLabel) {
        var input = $(allDayLabel).childNodesWithTag("input")[0];
        input.observe("change", onAllDayChanged.bindAsEventListener(input));
        if (input.checked) {
            for (var type in widgets) {
                widgets[type]['hour'].disabled = true;
                widgets[type]['minute'].disabled = true;
            }
        }
    }
}

function refreshAttendeesRO() {
    var attendeesMenu = $("attendeesMenu");
    var attendeesLabel = $("attendeesLabel");
    var attendeesDiv = $("attendeesDiv");
    
    if (attendeesLabel)
        attendeesLabel.setStyle({display: "block"});
    if (attendeesDiv)
        attendeesDiv.setStyle({display: "block"});
    
    if (attendeesMenu) {
        // Register "click" event on each attendee's email
        var attendees = attendeesMenu.getElementsByTagName('a');
        $A(attendees).each(function(attendee) {
            $(attendee).observe("click", onMailTo);
        });
    }
}

function refreshAttendees(newAttendees) {
    var attendeesLabel = $("attendeesLabel");
    var attendeesHref = $("attendeesHref");
    var attendeesMenu = $("attendeesMenu");

    if (!attendeesHref)
        return refreshAttendeesRO();
 
    if (attendeesMenu)
        attendeesMenu = $("attendeesMenu").down("ul");
  
    // Remove link of attendees
    for (var i = 0; i < attendeesHref.childNodes.length; i++)
        attendeesHref.removeChild(attendeesHref.childNodes[i]);

    // Remove attendees from menu
    var menuItems = $$("DIV#attendeesMenu LI.attendee");
    if (menuItems && attendeesMenu)
        for (var i = 0; i < menuItems.length; i++)
            attendeesMenu.removeChild(menuItems[i]);
 
    if (newAttendees)
        // Update global variable
        attendees = $H(newAttendees.evalJSON());

     if (attendees.keys().length > 0) {
        // Update attendees link and show label
        var names = new Array();
        attendees.values().each(function(attendee) {
            attendee = $H(attendee);
            var name = attendee.get('name') || attendee.get('email');
            if (!attendee.get('delegated-to'))
                names.push(name);

            if (attendeesMenu) {
                var delegatedTo = attendee.get('delegated-to');
                if (!attendee.get('delegated-from') || delegatedTo) {
                    var node = createElement("li");
                    attendeesMenu.appendChild(node);
                    setupAttendeeNode(node, attendee);
                }
                if (delegatedTo) {
                    var delegate = attendees.get(delegatedTo);
                    var node = createElement("li");
                    attendeesMenu.appendChild(node);
                    setupAttendeeNode(node, $H(delegate), true);
                }
            }
        });
        attendeesHref.appendChild(document.createTextNode(names.join(", ")));
        attendeesLabel.setStyle({ display: "block" });
    }
    else {
        // Hide link of attendees
        attendeesLabel.setStyle({ display: "none" });
    }
}

function setupAttendeeNode(aNode, aAttendee, isDelegate) {
    // Construct the display string from common name and/or email address.
    var name = aAttendee.get('name');
    var email = aAttendee.get('email');
//    if (name)
//        name += ' <' + email + '>';
//    else
//        name = email;
    name = name || email;
    
    aNode.writeAttribute("email", email);
    aNode.addClassName("attendee");
    var partstat = aAttendee.get('partstat');
    if (!partstat)
        partstat = "no-partstat";
    aNode.addClassName(partstat);
    if (isDelegate)
        aNode.addClassName("delegate");
    var statusIconNode = createElement("div", null, "statusIcon");
    aNode.appendChild(statusIconNode);
    aNode.appendChild(document.createTextNode(name));
    aNode.observe("click", onMailTo);
}

function initializeAttendeesHref() {
    var attendeesHref = $("attendeesHref");
    var attendeesLabel = $("attendeesLabel");
    var attendeesNames = $("attendeesNames");

    if (attendeesHref && !attendeesHref.hasClassName ("nomenu"))
        attendeesHref.observe("click", onAttendeesHrefClick, false);
    refreshAttendees();
}

function onAttendeesHrefClick(event) {
    popupToolbarMenu(this, 'attendeesMenu');
    preventDefault(event);
    return false;
}

function onMailTo(event) {
    var target = $(getTarget(event));
    var address = target.lastChild.nodeValue.trim() + " <" + target.readAttribute("email") + ">";
    openMailTo(address);
    Event.stop(event);
    return false;
}

function getMenus() {
    AppointmentEditor.attendeesMenu = new Array(onPopupAttendeesWindow,
                                                "-",
                                                onComposeToAllAttendees,
                                                onComposeToUndecidedAttendees,
                                                "-",
                                                null);
  
    var attendeesMenu = $('attendeesMenu');
    if (attendeesMenu)
        attendeesMenu.prepareVisibility = onAttendeesMenuPrepareVisibility;

    return { "attendeesMenu": AppointmentEditor.attendeesMenu };
}

function onAppointmentEditorLoad() {
    if (readOnly == false) {
        assignCalendar('startTime_date');
        assignCalendar('endTime_date');
        
        var widgets = {'start': {'date': $("startTime_date"),
                                 'hour': $("startTime_time_hour"),
                                 'minute': $("startTime_time_minute")},
                       'end': {'date': $("endTime_date"),
                               'hour': $("endTime_time_hour"),
                               'minute': $("endTime_time_minute")}};
        initTimeWidgets(widgets);
    }

    // Extend JSON representation of attendees
    attendees = $H(attendees);

    initializeAttendeesHref();
}

document.observe("dom:loaded", onAppointmentEditorLoad);
