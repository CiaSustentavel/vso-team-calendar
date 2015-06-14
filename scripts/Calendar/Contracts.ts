/**
* Interface for a calendar event provider
*/
export interface IEventSource {

    /**
    * Unique id of the event source
    */
    id: string;

    /**
    * Friendly display name of the event source
    */
    name: string;

    /**
    * Order used in sorting the event sources
    */
    order: number;

    /**
    * Set to true if events from this source should be rendered in the background.
    */
    background?: boolean;

    /**
    * Get the events that match a certain criteria
    *
    * @param query Events query
    */
    getEvents: (query?: IEventQuery) => IPromise<CalendarEvent[]>;

    /**
     * Get the event categories that match a certain criteria
     */
    getCategories(query: IEventQuery): IPromise<IEventCategory[]>;

    /**
    * Optional method to add events to a given source
    */
    addEvents?: (events: CalendarEvent[]) => IPromise<CalendarEvent[]>;

    /**
    * Optional method to remove events from this event source
    */
    removeEvents?: (events: CalendarEvent[]) => IPromise<CalendarEvent[]>;

    /**
    * Optional method to update an event in this event source
    */
    updateEvents?: (events: CalendarEvent[]) => IPromise<CalendarEvent[]>;
}

/**
 * Summary item for events
 */
export interface IEventCategory {
    /**
     * Title of the event category
     */
    title: string;

    /**
     * Sub title of the event category
     */
    subTitle?: string;

    /**
     * Image url of this category
     */
    imageUrl?: string;

    /**
     * Color of this category
     */
    color?: string;
}

/**
* Query criteria for events
*/
export interface IEventQuery {

    /**
    * If specified, only include events on or after the given date
    */
    startDate?: Date;
    
    /**
    * If specified, only include events on or before the given date
    */
    endDate?: Date;
}

/**
* Represents a single calendar event
*/
export interface CalendarEvent {

    /**
    * Title of the event
    */
    title: string;

    /**
    * Event start date
    */
    startDate: Date;

    /**
    * Event end date
    */
    endDate?: Date;

    /**
    * Unique id for the event
    */
    eventId?: string | number;

    /**
     * Category of the service
     */
    category?: string;

    /**
     * The member associated with this event
     */
    member?: ICalendarMember;
}

export interface ICalendarMember {
    /**
    * Display name of the member
    */
    displayName: string;

    /**
    * Unique ID for the member
    */
    id: string;

    /**
    * URL to the identity image for the member
    */
    imageUrl: string;

    /**
    * Unique name for the member
    */
    uniqueName: string;

    /**
    * URL for the member
    */
    url: string;
}

/**
* Represents a single calendar event
*/
export interface IExtendedCalendarEventObject {

    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    className?: string|string[];
    editable?: boolean;
    startEditable?: boolean;
    durationEditable?: boolean;
    rendering?: string;
    overlap?: boolean;
    constraint?: string;
    id?: string|number;
    title: string;
    allDay?: boolean;
    start: Date|string;
    end?: Date|string;
    url?: string;
    source?: any | IExtendedCalendarEventSource;
    member?: ICalendarMember;
    category?: string;
    eventType?: string;
}

/**
* Represents a single calendar event
*/
export interface IExtendedCalendarEventSource {
    events?: IExtendedCalendarEventObject[] | IEventSource;
}