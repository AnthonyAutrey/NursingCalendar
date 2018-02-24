import * as React from 'react';
import { UnownedEventModal } from '../Scheduler/UnownedEventModal';
import { ViewEventModal } from './ViewEventModal';
const request = require('superagent');
const FullCalendarReact = require('fullcalendar-reactwrapper');

interface Props {
	cwid: number;
	role: string;
	handleActiveRouteChange: Function;
}

interface State {
	events: Event[];
}

export interface Event {
	id: number;
	title: string;
	description: string;
	start: string;
	end?: string;
	ownerName: string;
	location: string;
	room: string;
	groups: string[];
}

export class ViewingCalendar extends React.Component<Props, State> {

	private viewEventModal: ViewEventModal | null;

	constructor(props: Props, state: State) {
		super(props, state);

		this.state = { events: [] };
	}

	componentWillMount() {
		this.getEventsFromDB();
		this.props.handleActiveRouteChange('Home');
	}

	render() {
		return (
			<div className="ViewingCalendar">
				<ViewEventModal ref={viewEventModal => { this.viewEventModal = viewEventModal; }} />
				<FullCalendarReact
					id="calendar"
					header={{
						left: 'prev,next today',
						center: 'title',
						right: 'month,agendaWeek,agendaDay'
					}}
					// defaultDate={(() => {
					// 	if (this.currentDate)
					// 		return this.currentDate;
					// 	else
					// 		return null;
					// })()}
					// defaultView={(() => {
					// 	if (this.currentView)
					// 		return this.currentView;
					// 	else
					// 		return 'agendaWeek';
					// })()}
					editable={false}
					slotEventOverlap={false}
					allDaySlot={false}
					eventOverlap={true}
					eventLimit={true} // allow "more" link when too many events
					eventClick={this.openViewEventModal}
					// dayClick={(date: any) => {
					// 	if (this.currentView === 'month') {
					// 		this.currentDate = date;
					// 		this.currentView = 'agendaWeek';
					// 		this.forceUpdate();
					// 	}
					// }}
					events={this.state.events}
					eventTextColor="white"
					// eventDrop={(event: Event, delta: Duration) => this.editEvent(event, delta)}
					// eventResize={(event: Event, delta: Duration) => this.editEvent(event, delta)}
					height={'auto'}
					// height={(view: any, x: any) => {
					// 	if (x === 'month')
					// 		return 700;

					// 	return 'auto';
					// }}
					// aspectRatio={1}
					// selectMinDistance={10}
					snapDuration={'00:15:00'}
					slotDuration={'00:30:00'}
					scrollTime={'6:00:00'}
					minTime={'06:00:00'}
					maxTime={'30:00:00'}
					// selectable={true}
					selectOverlap={false}
					selectHelper={true}
					// viewRender={(view: any) => this.cacheViewAndDate(view)}
					firstDay={1}
				// select={this.handleCalendarSelect}
				/>
			</div>
		);
	}

	public getEventsFromDB(): void {
		if (this.props.role === 'student')
			this.getStudentEvents();
		else
			request.get('/api/eventswithrelations').end((error: {}, res: any) => {
				if (res && res.body)
					this.setState({ events: this.parseDBEvents(res.body) });
			});
	}

	getStudentEvents(): string[] {
		let groups: string[] = [];

		let queryData = {
			fields: 'GroupName'
		};
		let queryDataString = JSON.stringify(queryData);

		new Promise((resolve, reject) => {
			request.get('/api/usergroups/' + this.props.cwid).set('queryData', queryDataString).end((error: {}, res: any) => {
				if (res && res.body)
					resolve(res.body);
				else
					reject();
			});
		}).then((userGroups: any) => {
			let eventQueryData = {
				where: {
					GroupName: userGroups.map((group: any) => {
						return group.GroupName;
					})
				}
			};

			let eventQueryDataString = JSON.stringify(eventQueryData);
			request.get('/api/eventswithrelations').set('queryData', eventQueryDataString).end((error: {}, res: any) => {
				if (res && res.body)
					this.setState({ events: this.parseDBEvents(res.body) });
			});

		}).catch(() => {
			// TODO: Handle Failure
		});

		return groups;
	}

	parseDBEvents(body: any): Event[] {
		let parsedEvents: Event[] = [];
		for (let event of body) {
			// let color = '';
			// let borderColor = '';

			let parsedEvent: any = {
				id: event.EventID,
				title: event.Title,
				description: event.Description,
				start: event.StartTime,
				end: event.EndTime,
				ownerName: event.OwnerName,
				groups: event.Groups,
				location: event.LocationName,
				room: event.RoomName
				// color: color,
				// borderColor: borderColor
			};

			parsedEvents.push(parsedEvent);
		}

		return parsedEvents;
	}

	openViewEventModal = (event: Event) => {
		if (this.viewEventModal)
			this.viewEventModal.beginView(event);
	}
}

export default ViewingCalendar;