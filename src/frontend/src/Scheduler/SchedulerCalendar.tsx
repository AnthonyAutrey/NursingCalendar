import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { CSSProperties } from 'react';
import { CreateEventModal } from './CreateEventModal';
import { EditEventModal } from './EditEventModal';
import { UnownedEventModal } from './UnownedEventModal';
import { Loading } from '../Generic/Loading';
import { ColorGenerator } from '../Utilities/Colors';
import { RecurringEventInfo, RecurringEvents } from '../Utilities/RecurringEvents';

import { Duration, Moment } from 'moment';
import * as moment from 'moment';
import { resolve } from 'url';
const FullCalendarReact = require('fullcalendar-reactwrapper');
const request = require('superagent');

interface Props {
	location: string;
	room: string;
	cwid: number;
	role: string;
	handleToolbarMessage: Function;
	handleToolbarText: Function;
	handleToolbarReset: Function;
}

interface State {
	events: Map<number, Event>;
	showCreateModal: boolean;
	groupOptionsFromAPI: string[];
	loading: boolean;
}

export interface Event {
	id: number;
	location: string;
	room: string;
	title: string;
	description: string;
	start: string;
	end: string;
	cwid: number;
	ownerName: string;
	groups: string[];
	pendingOverride: boolean;
	recurringInfo?: RecurringEventInfo;
	color?: string;
}

interface Log {
	message: string;
	details: string;
}

export class SchedulerCalendar extends React.Component<Props, State> {

	private scrollPosition: number = 0;
	private currentView: String | null = null;
	private currentDate: any | null = null;
	private smallestTimeInterval: number = Number.MAX_SAFE_INTEGER;
	private editEventModal: EditEventModal | null;
	private createEventModal: CreateEventModal | null;
	private unownedEventModal: UnownedEventModal | null;
	private eventCache: Map<number, Event>;
	private groupSemesterMap: Map<string, number | null> = new Map<string, number | null>();

	constructor(props: Props, state: State) {
		super(props, state);

		this.state = {
			events: new Map<number, Event>(),
			showCreateModal: false,
			groupOptionsFromAPI: [],
			loading: false
		};
	}

	componentWillMount() {
		this.getStateFromDB();
		let route = '/api/groups';
		if (this.props.role === 'instructor') {
			route = '/api/usergroups/' + this.props.cwid;
		}

		this.populateGroupSemesterMap().then(() => {
			this.forceUpdate();
		}).catch(() => {
			alert('Error getting data. Handle this properly!');
			// TODO: Handle this properly
		});

		request.get(route).end((error: {}, res: any) => {
			if (res && res.body) {
				let groups: string[] = [];
				res.body.forEach((group: any) => {
					groups.push(group.GroupName);
				});

				this.setState({ groupOptionsFromAPI: groups });
			} else
				alert('Error getting data. Handle this properly!');
			// TODO: Handle this properly
		});
	}

	componentWillUpdate() {
		const element = ReactDOM.findDOMNode(this);
		if (element != null)
			this.scrollPosition = window.scrollY;
	}

	componentDidUpdate() {
		const element = ReactDOM.findDOMNode(this);
		if (element != null)
			window.scrollTo(0, this.scrollPosition);
	}

	componentWillReceiveProps(nextProps: Props) {
		if (nextProps.room !== this.props.room || nextProps.location !== this.props.location)
			this.getStateFromDB(nextProps.room, nextProps.location);
	}

	render() {
		let loading = null;
		if (this.state.loading)
			loading = <Loading />;

		return (
			<div className="SchedulerCalendar">
				{loading}
				<CreateEventModal
					ref={createEventModal => { this.createEventModal = createEventModal; }}
					show={this.state.showCreateModal}
					groupOptionsFromAPI={this.state.groupOptionsFromAPI}
					creationHandler={this.handleEventCreation}
					closeHandler={this.closeEventCreationModal}
				/>
				<EditEventModal
					ref={editEventModal => { this.editEventModal = editEventModal; }}
					groupOptionsFromAPI={this.state.groupOptionsFromAPI}
					saveHandler={this.handleEventModify}
					deleteHandler={this.handleEventDeletion}
				/>
				<UnownedEventModal
					ref={unownedEventModal => { this.unownedEventModal = unownedEventModal; }}
					cwid={this.props.cwid}
					handleOverrideRequest={this.handleOverrideRequest}
				/>
				<FullCalendarReact
					id="calendar"
					customButtons={{
						selectDate: {
							text: 'Month',
							click: () => {
								this.currentView = 'month';
								this.props.handleToolbarText('Select a date to schedule events for that week.', 'info');
								this.forceUpdate();
							}
						},
						roomLabel: {
							text: this.props.location + ' - ' + this.props.room
						}
					}}
					header={{
						left: 'roomLabel',
						center: 'title',
						right: 'prev,selectDate,next today'
					}}
					defaultDate={(() => {
						if (this.currentDate)
							return this.currentDate;
						else
							return null;
					})()}
					defaultView={(() => {
						if (this.currentView)
							return this.currentView;
						else
							return 'agendaWeek';
					})()}
					editable={true}
					slotEventOverlap={false}
					allDaySlot={false}
					eventOverlap={false}
					eventRender={(event: any, element: any, view: any) => {
						let stripeColor = '(255, 255, 255, 0.1)';
						if (this.currentView === 'month')
							stripeColor = '(255, 255, 255, 0.2)';

						element.find('.fc-content').css('text-shadow', '-1px -1px 0 ' + event.color +
							', 1px -1px 0 ' + event.color + ', -1px 1px 0 ' + event.color + ', 1px 1px 0 ' + event.color);

						let semesterCSSMap: {} = {
							'none': '',
							'Semester 1': 'repeating-linear-gradient(-45deg,transparent,transparent 64px,rgba' + stripeColor +
								' 64px,rgba' + stripeColor + ' 66px)',
							'Semester 2': 'repeating-linear-gradient(-45deg,transparent,transparent 32px,rgba' + stripeColor +
								' 32px,rgba' + stripeColor + ' 34px)',
							'Semester 3': 'repeating-linear-gradient(-45deg,transparent,transparent 16px,rgba' + stripeColor +
								' 16px,rgba' + stripeColor + ' 18px)',
							'Semester 4': 'repeating-linear-gradient(-45deg,transparent,transparent 8px,rgba' + stripeColor +
								' 8px,rgba' + stripeColor + ' 10px)',
							'Semester 5': 'repeating-linear-gradient(-45deg,transparent,transparent 4px,rgba' + stripeColor +
								' 4px,rgba' + stripeColor + ' 6px)'
						};

						let groups = event.groups;
						if (groups && Number(groups.length) === 1) {
							let bgCSS = semesterCSSMap[this.groupSemesterMap.get(groups[0]) || 'none'];
							element.css('background', bgCSS);
						}
						element.css('background-color', event.color);

					}}
					displayEventEnd={this.currentView !== 'month'}
					timeFormat={'h(:mm)t'} // uppercase H for 24-hour clock
					eventLimit={true} // allow "more" link when too many events
					eventClick={this.handleEventClick}
					dayClick={(date: any) => {
						if (this.currentView === 'month') {
							this.currentDate = date;
							this.currentView = 'agendaWeek';
							this.props.handleToolbarReset();
							this.forceUpdate();
						}
					}}
					events={this.getStateEventsAsArray()}
					eventTextColor="white"
					eventDrop={(event: Event, delta: Duration) => this.editEvent(event, delta)}
					eventResize={(event: Event, delta: Duration) => this.editEvent(event, delta)}
					height={() => {
						if (this.currentView === 'month')
							return 700;

						return 'auto';
					}}
					aspectRatio={1}
					selectMinDistance={10}
					snapDuration={'00:15:00'}
					slotDuration={'00:30:00'}
					scrollTime={'6:00:00'}
					minTime={'06:00:00'}
					maxTime={'30:00:00'}
					selectable={true}
					selectOverlap={false}
					selectHelper={true}
					viewRender={(view: any) => this.cacheViewAndDate(view)}
					firstDay={1}
					eventLongPressDelay={0}
					selectLongPressDelay={300}
					select={this.handleCalendarSelect}
				/>
			</div>
		);
	}

	// Event Modals //////////////////////////////////////////////////////////////////////////////////
	handleCalendarSelect = (start: moment.Moment, end: Moment, jsEvent: any, view: any) => {
		// Don't allow events to be created in month view
		if (this.currentView === 'month')
			return;

		// Don't allow events to be less than x minutes
		if (moment.duration(end.diff(start)).asMinutes() < 30)
			end = start.clone().add({ minutes: 30 });

		// create a placeholder event for when modal is displayed
		// closing modal will remove this placeholder
		let events = this.cloneStateEvents();
		events.set(Number.MAX_SAFE_INTEGER, {
			id: Number.MAX_SAFE_INTEGER,
			location: '',
			room: '',
			title: 'New Event',
			description: 'modal placeholder',
			start: start.toISOString(),
			end: end.toISOString(),
			cwid: 0,
			ownerName: '',
			groups: [],
			pendingOverride: false
		});

		if (this.createEventModal) {
			this.createEventModal.setEventStart(start);
			this.createEventModal.setEventEnd(end);
		}

		this.setState({ events: events, showCreateModal: true });
	}

	handleEventCreation = (title: string, description: string, groups: string[], recurringInfo: RecurringEventInfo | undefined) => {
		let events: Map<number, Event> = this.cloneStateEvents();
		let index = this.getNextEventIndex();
		let placeholder = events.get(Number.MAX_SAFE_INTEGER);
		if (placeholder) {
			events.set(index, {
				id: index,
				location: this.props.location,
				room: this.props.room,
				title: title,
				description: description,
				start: placeholder.start,
				end: placeholder.end,
				cwid: this.props.cwid,
				ownerName: '',
				groups: groups,
				pendingOverride: false,
				recurringInfo: recurringInfo,
				color: ColorGenerator.getColor(groups[0])
			});
			events.delete(Number.MAX_SAFE_INTEGER);
		}

		let recurringEvents: Event[] = [];
		if (recurringInfo && placeholder)
			recurringEvents = this.getRecurringEvents(title, description, groups, placeholder.start, placeholder.end, recurringInfo);

		let filteredEventsAndConflicts = this.getFilteredEventsAndConflicts(recurringEvents);
		let conflictingEvents = filteredEventsAndConflicts.conflictingEvents;
		let filteredRecurringEvents = filteredEventsAndConflicts.filteredEvents;
		if (conflictingEvents.length > 0) {
			let confirmMessage = 'Some recurring events couldn\'t be added due to conflicts with the following events: ';
			conflictingEvents.forEach(event => {
				confirmMessage += '\n\n' + event.title + '\n      start: ' + moment(event.start).toLocaleString() +
					'\n      end: ' + moment(event.end).toLocaleString();
			});
			if (!confirm(confirmMessage + '\n\nDo you want to continue?'))
				return;
		}

		filteredRecurringEvents.forEach(event => {
			index++;
			event.id = index;
			events.set(index, event);
		});

		this.setState({ events: events }, () => this.closeEventCreationModal());
	}

	// Recurring Events //////////////////////////////////////////////////////////////////////////////////////////////////////

	getDailyRecurringEvents(
		title: string,
		description: string,
		groups: string[],
		beginDateString: string,
		endDateString: string,
		recurringInfo: RecurringEventInfo): Event[] {

		let recurringEvents: Event[] = [];
		let beginDate = moment(beginDateString).utc(true);
		let endDate = moment(endDateString).utc(true);
		let iterateDate = beginDate.clone().add(1, 'days');
		let repeatEndDate = recurringInfo.endDate.clone().add(1, 'days');

		while (iterateDate.isBefore(repeatEndDate)) {
			let start = iterateDate.clone().set({ hour: beginDate.hour(), minute: beginDate.minute() }).toISOString();
			let end = iterateDate.clone().set({ hour: endDate.hour(), minute: endDate.minute() }).toISOString();

			recurringEvents.push({
				id: -1,
				location: this.props.location,
				room: this.props.room,
				title: title,
				description: description,
				start: start,
				end: end,
				cwid: this.props.cwid,
				ownerName: '',
				groups: groups,
				pendingOverride: false,
				color: ColorGenerator.getColor(groups[0])
			});

			iterateDate.add(1, 'days');
			// recurringIndex++;
		}

		return recurringEvents;
	}

	getRecurringEvents(
		title: string,
		description: string,
		groups: string[],
		beginDateString: string,
		endDateString: string,
		recurringInfo: RecurringEventInfo): Event[] {

		let recurringEvents: Event[] = [];
		let beginDate = moment(beginDateString).utc(true);
		let endDate = moment(endDateString).utc(true);
		let iterateDate = beginDate.clone().add(1, 'days');
		let repeatEndDate = recurringInfo.endDate.clone().add(1, 'days');

		while (iterateDate.isBefore(repeatEndDate)) {
			let start = iterateDate.clone().set({ hour: beginDate.hour(), minute: beginDate.minute() }).toISOString();
			let end = iterateDate.clone().set({ hour: endDate.hour(), minute: endDate.minute() }).toISOString();

			if (this.createEventModal && (
				(recurringInfo.type === 'monthly' &&
					RecurringEvents.getWeekDayCount(iterateDate) + RecurringEvents.getDayOfWeekChar(iterateDate) === recurringInfo.monthlyDay) ||
				(recurringInfo.type === 'weekly' && recurringInfo.weeklyDays &&
					recurringInfo.weeklyDays.includes(RecurringEvents.getDayOfWeekChar(iterateDate))) ||
				recurringInfo.type === 'daily'))
				recurringEvents.push({
					id: -1,
					location: this.props.location,
					room: this.props.room,
					title: title,
					description: description,
					start: start,
					end: end,
					cwid: this.props.cwid,
					ownerName: '',
					groups: groups,
					pendingOverride: false,
					recurringInfo: recurringInfo,
					color: ColorGenerator.getColor(groups[0])
				});

			iterateDate.add(1, 'days');
		}

		return recurringEvents;
	}

	getFilteredEventsAndConflicts = (events: Event[]): { filteredEvents: Event[], conflictingEvents: Event[] } => {
		let conflictingEvents: Event[] = [];

		let filteredEvents = events.filter(recurringEvent => {
			if (recurringEvent.start.substr(recurringEvent.start.length - 1, 1) !== 'Z')
				recurringEvent.start += '.000Z';
			if (recurringEvent.end.substr(recurringEvent.end.length - 1, 1) !== 'Z')
				recurringEvent.end += '.000Z';

			let recurringEventStart = moment(recurringEvent.start);
			let recurringEventEnd = moment(recurringEvent.end);

			let noConflicts = true;
			this.getStateEventsAsArray().forEach((stateEvent: Event) => {
				if (stateEvent.start.substr(stateEvent.start.length - 1, 1) !== 'Z')
					stateEvent.start += '.000Z';
				if (stateEvent.end.substr(stateEvent.end.length - 1, 1) !== 'Z')
					stateEvent.end += '.000Z';

				if (recurringEventStart.isBefore(moment(stateEvent.end).utc()) &&
					recurringEventEnd.isAfter(moment(stateEvent.start).utc())) {
					conflictingEvents.push(stateEvent);
					noConflicts = false;
				}
			});

			return noConflicts;
		});

		return { filteredEvents: filteredEvents, conflictingEvents: conflictingEvents };
	}

	// Persist Recurring Events //////////////////////////////////////////////////////////////////////////////////////////////////
	getRecurringRelationsForRoomFromDB = (): Promise<{ uuid: string, eventID: string }[]> => {
		return new Promise((resolved, reject) => {
			let queryData = JSON.stringify({
				where: {
					LocationName: this.props.location,
					RoomName: this.props.room,
				}
			});

			request.get('/api/recurringeventrelations').set('queryData', queryData).end((error: {}, res: any) => {
				if (res && res.body)
					resolved(this.parseRecurringRelations(res.body));
				else
					reject();
			});
		});
	}

	parseRecurringRelations = (body: any[]): { uuid: string, eventID: string }[] => {
		let recurringRelations: { uuid: string, eventID: string }[] = [];

		body.forEach(dbRelation => {
			recurringRelations.push({
				uuid: dbRelation.RecurringID,
				eventID: dbRelation.EventID
			});
		});

		return recurringRelations;
	}

	persistRecurringEvents = (): Promise<null> => {
		return new Promise((resolved, reject) => {
			this.getRecurringRelationsForRoomFromDB().then(recurringRelations => {
				let recurringRelationsToAdd = this.getRecurringRelationsToAddToDB(recurringRelations);
				console.log('Recurring Relations to Add');
				console.log(recurringRelationsToAdd);

				let recurringRelationsToDelete = this.getRecurringRelationsToDeleteFromDB(recurringRelations);
				console.log('Recurring Relations to Delete');
				console.log(recurringRelationsToDelete);

				let promises = [
					this.addRecurringRelationsToDB(recurringRelationsToAdd),
					this.deleteRecurringRelationsFromDB(recurringRelationsToDelete)
				];

				Promise.all(promises).then(() => {
					resolved();
				}).catch(() => {
					reject();
				});

			}).catch(() => {
				reject();
			});
		});
	}

	getRecurringRelationsToAddToDB = (recurringRelations: { uuid: string, eventID: string }[]) => {

		let recurringRelationValues: Set<string> = new Set();
		recurringRelations.forEach(relation => {
			recurringRelationValues.add(relation.eventID + relation.uuid);
		});

		let recurringEventsToAdd = this.getStateEventsAsArray().filter(event => {
			// let matchingRecurringRelation = recurringRelations.find(relation => {
			// 	return Number(relation.eventID) === Number(event.id) && event.recurringInfo !== undefined && relation.uuid === event.recurringInfo.id;
			// });
			return event.recurringInfo && !recurringRelationValues.has(event.id + event.recurringInfo.id);
		});

		let recurringRelationsToAdd = recurringEventsToAdd.map(event => {
			if (event.recurringInfo) {
				let relationToAdd: any = {
					RecurringID: event.recurringInfo.id,
					EventID: event.id,
					LocationName: event.location,
					RoomName: event.room,
					RecurringType: event.recurringInfo.type
				};

				if (event.recurringInfo.monthlyDay)
					relationToAdd.MonthlyWeekday = event.recurringInfo.monthlyDay;

				if (event.recurringInfo.weeklyDays)
					relationToAdd.WeeklyDays = event.recurringInfo.weeklyDays;

				return relationToAdd;
			} else
				return {};
		});

		return recurringRelationsToAdd;
	}

	getRecurringRelationsToDeleteFromDB = (recurringRelations: { uuid: string, eventID: string }[]) => {

		let eventRelationValues: Set<string> = new Set();
		this.getStateEventsAsArray().forEach(event => {
			if (event.recurringInfo)
				eventRelationValues.add(event.id.toString() + event.recurringInfo.id);
		});

		let recurringRelationsToDelete = recurringRelations.filter(dbRelation => {
			return !eventRelationValues.has(dbRelation.eventID + dbRelation.uuid);
		});

		let completedRecurringRelationsToDelete = recurringRelationsToDelete.map(relation => {
			return {
				RecurringID: relation.uuid,
				EventID: relation.eventID,
				LocationName: this.props.location,
				RoomName: this.props.room,
			};
		});

		return completedRecurringRelationsToDelete;
	}

	addRecurringRelationsToDB = (recurringRelations: {}[]): Promise<null> => {
		return new Promise((resolved, reject) => {
			if (recurringRelations.length <= 0) {
				resolved();
				return;
			}

			let queryData: {}[] = recurringRelations.map(relation => {
				return {
					insertValues: relation
				};
			});

			while (queryData.length > 0) {
				let queryDataPart = queryData.slice(0, 20);
				queryData.splice(0, 20);

				let queryDataString = JSON.stringify(queryDataPart);
				request.put('/api/recurringeventrelations').set('queryData', queryDataString).end((error: {}, res: any) => {
					if (res && res.body)
						resolved();
					else
						reject();
				});
			}
		});
	}

	deleteRecurringRelationsFromDB = (recurringRelations: {}[]): Promise<null> => {
		return new Promise((resolved, reject) => {
			if (recurringRelations.length <= 0) {
				resolved();
				return;
			}

			let queryData: {}[] = recurringRelations.map((relation: any) => {
				return {
					where: {
						RecurringID: relation.RecurringID,
						EventID: relation.EventID,
						RoomName: this.props.room,
						LocationName: this.props.location
					}
				};
			});

			let promises = [];
			while (queryData.length > 0) {
				let queryDataPart = queryData.slice(0, 20);
				queryData.splice(0, 20);

				promises.push(new Promise((resAPI, rejAPI) => {
					let queryDataString = JSON.stringify(queryDataPart);
					request.delete('/api/recurringeventrelations').set('queryData', queryDataString).end((error: {}, res: any) => {
						if (res && res.body)
							resAPI();
						else
							rejAPI();
					});
				}));
			}

			Promise.all(promises).then(() => { resolved(); }).catch(() => { reject(); });

			// let deleteAllPromises: Promise<null>[] = [];
			// queryDataArray.forEach(queryData => {
			// 	deleteAllPromises.push(new Promise((resolveDelete, rejectDelete) => {
			// 		let queryDataString = JSON.stringify(queryData);
			// 		request.delete('/api/recurringeventrelations').set('queryData', queryDataString).end((error: {}, res: any) => {
			// 			if (res && res.body)
			// 				resolveDelete();
			// 			else
			// 				rejectDelete();
			// 		});
			// 	}));
			// });

			// Promise.all(deleteAllPromises).then(() => resolved()).catch(() => reject());
		});
	}

	closeEventCreationModal = () => {
		this.setState({ showCreateModal: false });
		let events = this.cloneStateEvents();
		let placeholder = events.get(Number.MAX_SAFE_INTEGER);
		if (placeholder && Number(placeholder.id) === Number.MAX_SAFE_INTEGER &&
			placeholder.description === 'modal placeholder') {
			events.delete(Number.MAX_SAFE_INTEGER);
			this.setState({ events: events });
		}
	}

	handleEventModify = (eventID: number, title: string, description: string, groups: string[], modifyAllRecurring: boolean = false) => {
		let events = this.cloneStateEvents();
		let eventToModify = events.get(eventID);

		if (eventToModify) {
			if (eventToModify.recurringInfo && modifyAllRecurring)
				this.modifyEntireRecurringEvent(eventToModify, title, description, groups);
			else {
				let color = '#800029';
				if (groups.length === 1)
					color = ColorGenerator.getColor(groups[0]);
				eventToModify.title = title;
				eventToModify.description = description;
				eventToModify.groups = groups;
				eventToModify.color = color;
				eventToModify.recurringInfo = undefined;
				events.set(eventID, eventToModify);
				this.setState({ events: events });
			}
		}
	}

	modifyEntireRecurringEvent = (event: Event, title: string, description: string, groups: string[]) => {
		if (event.recurringInfo) {
			let color = '#800029';
			if (groups.length === 1)
				color = ColorGenerator.getColor(groups[0]);

			let recurringID = event.recurringInfo.id;
			let eventMap = this.cloneStateEvents();
			let events = this.getStateEventsAsArray().forEach(stateEvent => {
				if (stateEvent.recurringInfo && stateEvent.recurringInfo.id === recurringID) {
					let modifiedEvent = this.cloneEvent(stateEvent);
					modifiedEvent.title = title;
					modifiedEvent.description = description;
					modifiedEvent.groups = groups;
					modifiedEvent.color = color;
					eventMap.set(stateEvent.id, modifiedEvent);
				}
			});

			this.setState({ events: eventMap });
		}
	}

	handleEventDeletion = (eventID: number, deleteAllRecurring: boolean = false) => {
		let events = this.cloneStateEvents();
		let eventToDelete = events.get(eventID);
		if (eventToDelete && eventToDelete.recurringInfo && deleteAllRecurring)
			this.deleteEntireRecurringEvent(eventToDelete);
		else {
			events.delete(eventID);
			this.setState({ events: events });
		}
	}

	deleteEntireRecurringEvent = (event: Event) => {
		if (event.recurringInfo) {
			let recurringID = event.recurringInfo.id;
			let eventMap = this.cloneStateEvents();
			let events = this.getStateEventsAsArray().forEach(stateEvent => {
				if (stateEvent.recurringInfo && stateEvent.recurringInfo.id === recurringID)
					eventMap.delete(stateEvent.id);
			});

			this.setState({ events: eventMap });
		}
	}

	handleEventClick = (event: any, jsEvent: any, view: any) => {
		let events = this.cloneStateEvents();
		let clickedEvent: Event | undefined = events.get(event.id);
		if (clickedEvent && Number(clickedEvent.cwid) === Number(this.props.cwid) || clickedEvent && this.props.role === 'administrator')
			this.openEditEventModal(clickedEvent.id, clickedEvent.title, clickedEvent.description, clickedEvent.groups, clickedEvent.recurringInfo);
		else if (clickedEvent)
			this.openUnownedEventModal(clickedEvent);
	}

	openEditEventModal = (eventID: number, title: string, description: string, groups: string[], recurringInfo?: RecurringEventInfo) => {
		if (this.editEventModal)
			this.editEventModal.beginEdit(eventID, title, description, groups, recurringInfo);
	}

	openUnownedEventModal = (event: Event) => {
		if (this.unownedEventModal)
			this.unownedEventModal.beginEdit(event);
	}

	handleOverrideRequest = (eventID: number) => {
		let events: Map<number, Event> = this.cloneStateEvents();
		let eventWithRequest: Event | undefined = events.get(eventID);
		if (eventWithRequest) {
			eventWithRequest.pendingOverride = true;
			events.set(eventID, eventWithRequest);
			this.setState({ events: events });
			if (this.unownedEventModal)
				this.unownedEventModal.beginEdit(eventWithRequest);
		}
	}

	// Client Events //////////////////////////////////////////////////////////////////////////////////////////////
	public getStateFromDB(room: string = this.props.room, location: string = this.props.location): void {
		this.setState({ loading: true });
		let queryData: {} = {
			where: {
				RoomName: room,
				LocationName: location
			}
		};
		let queryDataString = JSON.stringify(queryData);
		request.get('/api/eventswithrelations').set('queryData', queryDataString).end((error: {}, res: any) => {
			if (res && res.body) {
				let events = this.parseDBEvents(res.body);
				this.eventCache = this.parseDBEvents(res.body);

				this.setState({ events: events, loading: false });
			}
		});
	}

	cloneStateEvents = (): Map<number, Event> => {
		let events: Map<number, Event> = new Map<number, Event>();
		Array.from(this.state.events.keys()).forEach(key => {
			let event = this.state.events.get(key);
			if (event)
				events.set(key, this.cloneEvent(event));
		});

		return events;
	}

	cloneEvent(event: any): any {
		return {
			cwid: event.cwid,
			description: event.description,
			end: event.end,
			groups: event.groups,
			id: event.id,
			location: event.location,
			room: event.room,
			ownerName: event.ownerName,
			pendingOverride: event.pendingOverride,
			start: event.start,
			title: event.title,
			editable: event.editable,
			color: event.color,
			borderColor: event.borderColor,
			recurringInfo: event.recurringInfo
		};
	}

	getNextEventIndex = () => {
		let index: number = 0;
		Array.from(this.state.events.keys()).forEach(key => {
			key = Number(key);
			if (key >= index && key !== Number.MAX_SAFE_INTEGER)
				index = key + 1;
		});

		return index;
	}

	editEvent(event: Event, delta: Duration): void {

		if (event.recurringInfo && !confirm('This is a recurring event. Do you want to continue this action and make the event independent?')) {
			this.forceUpdate();
			return;
		}
		// prevent event from being edited to less than 30 minutes in duration
		let start: Moment = moment(event.start);
		let end: Moment = moment(event.end);
		if (moment.duration(end.diff(start)).asMinutes() < 30)
			end = start.clone().add({ minutes: 30 });

		let editedEvent: Event = event;
		editedEvent.id = event.id;
		editedEvent.title = event.title;
		editedEvent.start = start.toISOString();
		editedEvent.end = end.toISOString();
		editedEvent.recurringInfo = undefined;
		let index: number | string = event.id;
		let events = this.cloneStateEvents();

		events.set(index, editedEvent);
		this.setState({ events: events });
	}

	getStateEventsAsArray(): Event[] {
		return Array.from(this.state.events.values());
	}

	parseDBEvents(body: any): Map<number, Event> {
		let parsedEvents: Map<number, Event> = new Map();
		for (let event of body) {
			let userOwnsEvent: boolean = Number(event.CWID) === Number(this.props.cwid) || this.props.role === 'administrator';
			let color = '#800029';
			if (event.Groups.length === 1)
				color = ColorGenerator.getColor(event.Groups[0].GroupName);
			let borderColor = '';

			if (!userOwnsEvent) {
				borderColor = 'rgba(128,0,41,.4)';
				color = 'rgba(128,0,41,.6)';
			}

			let groups: string[] = event.Groups.map((group: any) => {
				return group.GroupName;
			});

			let parsedEvent: any = {
				id: event.EventID,
				location: event.LocationName,
				room: event.RoomName,
				title: event.Title,
				description: event.Description,
				start: event.StartTime,
				end: event.EndTime,
				cwid: event.CWID,
				ownerName: event.OwnerName,
				groups: groups,
				pendingOverride: event.PendingOverride,
				color: color,
				borderColor: borderColor,
				editable: userOwnsEvent
			};

			parsedEvents.set(event.EventID, parsedEvent);
		}

		return parsedEvents;
	}

	eventsAreEqual(event1?: Event, event2?: Event): boolean {
		return (event1 !== undefined && event2 !== undefined &&
			event1.cwid === event2.cwid &&
			event1.description === event2.description &&
			event1.end === event2.end &&
			event1.groups.join() === event2.groups.join() &&
			event1.id === event2.id &&
			event1.ownerName === event2.ownerName &&
			event1.pendingOverride === event2.pendingOverride &&
			event1.start === event2.start &&
			event1.title === event2.title);
	}

	// Event Persistence /////////////////////////////////////////////////////////////////////////////////////////////////
	persistStateToDB(): void {
		this.props.handleToolbarText('Submitting data, please wait.', 'info');
		this.forceUpdate();
		this.setState({ loading: true });
		let persistPromises: Promise<any>[] = [];
		persistPromises.push(this.deleteDBEventsNotInClient());

		persistPromises.push(new Promise((resolved, reject) => {
			this.getClientEventIDsThatAreAlreadyInDB().then((eventIDsInDB) => {
				this.sendNotificationsToOwnersIfModifiedByNonOwner(eventIDsInDB);

				let persistNewEventsThenRecurringEvents = new Promise((res, rej) => {
					let eventsNotInDB = this.getClientEventsNotYetInDB(eventIDsInDB);

					this.persistNewEventsToDB(eventsNotInDB).then(() => {
						this.persistRecurringEvents().then(() => {
							res();
						}).catch(() => {
							rej();
						});
					}).catch(() => {
						rej();
					});
				});

				let promises: Promise<any>[] = [
					this.updateExistingEventsInDB(eventIDsInDB),
					persistNewEventsThenRecurringEvents
				];

				Promise.all(promises).then(() => {
					resolved();
				}).catch(() => {
					reject();
				});
			}).catch(() => reject());
		}));

		Promise.all(persistPromises).then(() => {
			this.props.handleToolbarReset();
			this.forceUpdate();
			this.props.handleToolbarMessage('Changes saved successfully!', 'success');
			this.eventCache = this.cloneStateEvents();
			this.setState({ loading: false });
		}).catch(() => {
			this.props.handleToolbarMessage('Error saving data.', 'error');
		});
	}

	getClientEventIDsThatAreAlreadyInDB(): Promise<number[]> {
		return new Promise((resolved, reject) => {
			let ids: number[] = Array.from(this.state.events.keys());

			let queryData = {
				fields: ['EventID'], where: {
					EventID: ids,
					LocationName: this.props.location,
					RoomName: this.props.room
				}
			};
			let queryDataString = JSON.stringify(queryData);
			let stateEventsThatAreAlreadyInDB: number[] = [];
			request.get('/api/events').set('queryData', queryDataString).end((error: {}, res: any) => {
				if (res && res.body)
					resolved(this.getEventIdsFromResponseBody(res.body));
				else
					reject();
			});
		});
	}

	deleteDBEventsNotInClient(): Promise<any> {
		return new Promise((resolveOuter, rejectOuter) => {
			new Promise((resolved, reject) => {
				let queryData = {
					fields: 'EventID',
					where: {
						LocationName: this.props.location,
						RoomName: this.props.room
					}
				};
				let queryDataString = JSON.stringify(queryData);
				request.get('/api/events').set('queryData', queryDataString).end((error: {}, res: any) => {
					if (res && res.body)
						resolved(res.body.map((event: any) => { return Number(event.EventID); }));
					else
						reject();
				});
			}).then((allDBEventIDsForRoom: number[]) => {
				let clientEventIDs: number[] = Array.from(this.state.events.keys()).map(id => { return Number(id); });
				let eventsIDsToDelete: number[] = [];

				allDBEventIDsForRoom.forEach(id => {
					if (!clientEventIDs.includes(id))
						eventsIDsToDelete.push(Number(id));
				});

				if (eventsIDsToDelete.length > 0) {
					let queryData: {} = {
						where: {
							EventID: eventsIDsToDelete,
							CWID: Number(this.props.cwid),
							RoomName: this.props.room,
							LocationName: this.props.location
						}
					};
					if (this.props.role === 'administrator')
						queryData = {
							where: {
								EventID: eventsIDsToDelete,
								RoomName: this.props.room,
								LocationName: this.props.location
							}
						};
					let queryDataString = JSON.stringify(queryData);
					request.delete('/api/events').set('queryData', queryDataString).end((error: {}, res: any) => {
						if (res && res.body) {
							this.logEventDeletions(eventsIDsToDelete);
							resolveOuter();
						} else
							rejectOuter();
					});
				} else
					resolveOuter();
			}).catch(() => rejectOuter());
		});
	}

	sendNotificationsToOwnersIfModifiedByNonOwner(eventIDsInDB: number[]) {
		let unownedEvents: Event[] = [];
		this.state.events.forEach(event => {
			if (eventIDsInDB.includes(event.id) &&
				Number(event.cwid) !== Number(this.props.cwid) &&
				!this.eventsAreEqual(this.eventCache.get(event.id), event))
				unownedEvents.push(event);
		});

		unownedEvents.forEach(unownedEvent => {
			let queryData = {
				insertValues: {
					'Title': 'Event changed!',
					'Message': 'Your event, \'' + unownedEvent.title + '\', has been modified by an admin!',
					'ToCWID': unownedEvent.cwid
				}
			};
			let queryDataString = JSON.stringify(queryData);
			request.put('/api/notifications').set('queryData', queryDataString).end((error: {}, res: any) => {
				if (!res || !res.body)
					alert('sending unowned event notification failed! Handle this properly!');
			});
		});
	}

	updateExistingEventsInDB(eventIDsInDB: number[]): Promise<void> {
		return new Promise((resolved, reject) => {
			let eventsToUpdate: Event[] = [];
			eventIDsInDB.forEach((id) => {
				let eventToUpdate = this.state.events.get(id);
				if ((eventToUpdate && Number(eventToUpdate.cwid) === Number(this.props.cwid) || eventToUpdate && this.props.role === 'administrator') &&
					!this.eventsAreEqual(eventToUpdate, this.eventCache.get(id)))
					eventsToUpdate.push(eventToUpdate);
			});

			let queryData: {}[] = [];

			eventsToUpdate.forEach((event: Event) => {
				let setValues: {} = {
					'Title': event.title,
					'Description': event.description,
					'StartTime': event.start,
					'EndTime': event.end
				};

				queryData.push({
					groups: event.groups,
					setValues: setValues,
					where: { EventID: event.id, RoomName: this.props.room, LocationName: this.props.location }
				});
			});

			let promises = [];
			while (queryData.length > 0) {
				let queryDataPart = queryData.slice(0, 15);
				queryData.splice(0, 15);

				promises.push(new Promise((resAPI, rejAPI) => {
					let queryDataString = JSON.stringify(queryDataPart);
					request.post('/api/events').set('queryData', queryDataString).end((error: {}, res: any) => {
						if (res && res.body) {
							resAPI();
						} else
							rejAPI();
					});
				}));
			}

			Promise.all(promises).then(() => {
				let eventsToLog = this.exludeDuplicateRecurringEvents(eventsToUpdate);
				this.logEventUpdates(eventsToLog);

				resolved();
			}).catch(() => { reject(); });
		});
	}

	exludeDuplicateRecurringEvents = (events: Event[]) => {
		let recurringIDs = new Set();
		let singularRecurringEvents: Event[] = [];
		let eventsToLog = events.filter(event => {
			if (event.recurringInfo && !recurringIDs.has(event.recurringInfo.id)) {
				recurringIDs.add(event.recurringInfo.id);
				singularRecurringEvents.push(event);
			}
			return event.recurringInfo === undefined;
		});

		return eventsToLog.concat(singularRecurringEvents);
	}

	getClientEventsNotYetInDB(alreadyInDB: number[]): Event[] {
		let clientEventsNotInDBMap: Map<number, Event> = this.cloneStateEvents();
		alreadyInDB.forEach((id) => {
			clientEventsNotInDBMap.delete(id);
		});

		let clientEventsNotYetInDB: Event[] = Array.from(clientEventsNotInDBMap.values());
		return clientEventsNotYetInDB;
	}

	persistNewEventsToDB(events: Event[]): Promise<any> {
		return new Promise((resolved, reject) => {
			let eventsToCreate: Event[] = [];
			events.forEach(event => {
				eventsToCreate.push(event);
			});

			let queryData: {}[] = [];
			eventsToCreate.forEach((event) => {
				queryData.push({
					insertValues: {
						'CWID': this.props.cwid,
						'EventID': event.id,
						'LocationName': this.props.location,
						'RoomName': this.props.room,
						'Title': event.title,
						'Description': event.description,
						'StartTime': event.start,
						'EndTime': event.end
					},
					groups: event.groups
				});
			});

			if (queryData.length <= 0) {
				resolved();
				return;
			}

			let promises = [];
			while (queryData.length > 0) {
				let queryDataPart = queryData.slice(0, 17);
				queryData.splice(0, 17);

				promises.push(new Promise((resAPI, rejAPI) => {
					let queryDataString = JSON.stringify(queryDataPart);
					console.log(queryDataPart);
					console.log('..............');
					request.put('/api/events').set('queryData', queryDataString).end((error: {}, res: any) => {
						if (res && res.body)
							resAPI();
						else {
							rejAPI();
						}
					});
				}));
			}

			Promise.all(promises).then(() => {
				let eventsToLog = this.exludeDuplicateRecurringEvents(eventsToCreate);
				this.logEventCreations(eventsToLog);
				resolved();
			}).catch(() => { reject(); });
		});
	}

	getEventIdsFromResponseBody(body: any): number[] {
		let ids: number[] = [];

		for (let event of body)
			ids.push(event.EventID);

		return ids;
	}

	// Groups ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	populateGroupSemesterMap = (): Promise<null> => {
		return new Promise((resolved, reject) => {
			request.get('/api/semestergroups').end((error: {}, res: any) => {
				if (res && res.body) {
					res.body.forEach((result: any) => {
						this.groupSemesterMap.set(result.GroupName, result.Semester);
					});
					resolved();
				} else
					reject();
			});
		});
	}

	// Store Calendar State /////////////////////////////////////////////////////////////////////////////////////////////////////////
	cacheViewAndDate(view: any) {
		this.currentView = view.name;
		if (!this.currentDate)
			this.currentDate = view.intervalStart;
		if (this.currentDate.isBefore(view.intervalStart) || this.currentDate.isAfter(view.intervalEnd.subtract(1, 'minutes'))) {
			this.currentDate = view.intervalStart;
			this.smallestTimeInterval = view.intervalEnd - view.intervalStart;
		}
	}

	// Prevent Leaving Without Save /////////////////////////////////////////////////////////////////////////////////////////////////
	public eventsHaveBeenModified() {
		let eventsHaveBeenModified = false;
		this.state.events.forEach(event => {
			if (!this.eventsAreEqual(event, this.eventCache.get(event.id)))
				eventsHaveBeenModified = true;
		});

		if (this.state.events.size !== this.eventCache.size)
			eventsHaveBeenModified = true;

		return eventsHaveBeenModified;
	}

	// Logging ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	logEventCreations = (createdEvents: Event[]) => {
		let logMessages: Log[] = [];

		createdEvents.forEach(event => {
			logMessages.push({
				message: 'Event Created',
				details: 'Event Details: ' + this.getEventValuesString(event)
			});
		});

		this.persistLogs(logMessages);
	}
	logEventUpdates = (updatedEvents: Event[]) => {
		let logs: Log[] = [];

		updatedEvents.forEach(event => {
			let originalEvent = this.eventCache.get(event.id);
			let newEvent = this.state.events.get(event.id);
			if (originalEvent && newEvent && !this.eventsAreEqual(originalEvent, newEvent))
				logs.push({
					message: 'Event Modified',
					details: 'Original Values: ' + this.getEventValuesString(originalEvent) +
						', New Values: ' + this.getEventValuesString(newEvent)
				});
		});

		this.persistLogs(logs);
	}

	logEventDeletions = (deletedEventIDs: number[]) => {
		let logs: Log[] = [];

		let deletedEvents: Event[] = [];
		deletedEventIDs.forEach(id => {
			let event = this.eventCache.get(id);
			if (event)
				deletedEvents.push(event);
		});

		deletedEvents.forEach(event => {
			logs.push({
				message: 'Event Deleted',
				details: 'Event Details: ' + this.getEventValuesString(event)
			});
		});

		this.persistLogs(logs);
	}

	getEventValuesString = (event: Event): string => {
		let eventValuesString = 'title: ' + event.title +
			', description: ' + event.description +
			', location: ' + event.location +
			', room: ' + event.room +
			', groups: [' + event.groups.join(', ') + ']' +
			', start: ' + event.start.toLocaleString().substr(0, 19) +
			', end: ' + event.end.toLocaleString().substr(0, 19);

		return eventValuesString;
	}

	persistLogs = (logs: Log[]) => {
		let queryData: {}[] = [];
		logs.forEach(log => {
			queryData.push({
				insertValues: {
					CWID: this.props.cwid,
					Message: log.message,
					Details: log.details
				}
			});
		});

		while (queryData.length > 0) {
			let queryDataPart = queryData.slice(0, 20);
			queryData.splice(0, 20);

			let queryDataString = JSON.stringify(queryDataPart);
			request.put('/api/logs').set('queryData', queryDataString).end();
		}

	}
}

export default SchedulerCalendar;