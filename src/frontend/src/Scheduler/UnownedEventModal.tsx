import * as React from 'react';
import { Event } from './SchedulerCalendar';
import { CSSProperties } from 'react';
import { RecurringEventInfo, RecurringEvents } from '../Utilities/RecurringEvents';
const request = require('superagent');
const uuid = require('uuid/v4');

interface Props {
	cwid: number;
	handleOverrideRequest: Function;
	handleShowAlert: Function;
}

interface State {
	show: boolean;
	showRequestForm: boolean;
	showRecurrenceOptions: boolean;
	requestForAllRecurring: boolean;
	requestMessage: string;
	event: Event | null;
}

export class UnownedEventModal extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);
		this.state = {
			show: false,
			showRequestForm: false,
			showRecurrenceOptions: false,
			requestForAllRecurring: false,
			requestMessage: '',
			event: null
		};
	}

	render() {
		if (!this.state.show || !this.state.event)
			return null;

		let backdropStyle: CSSProperties = {
			zIndex: Number.MAX_SAFE_INTEGER,
			position: 'fixed',
			overflow: 'auto',
			top: 0,
			bottom: 0,
			left: 0,
			right: 0,
			backgroundColor: 'rgba(0,0,0,0.3)',
			padding: 'auto'
		};

		if (!this.state.event)
			return null;

		let descriptionString = this.state.event.description;
		if (this.state.event.description === '')
			descriptionString = 'No description.';

		let recurringDetailString = null;
		if (this.state.event && this.state.event.recurringInfo)
			recurringDetailString = this.getRecurringDetailString();

		let groupString: string[] = this.state.event.groups.map(event => {
			return event + ', ';
		});
		if (this.state.event.groups.length > 0)
			groupString[groupString.length - 1] = groupString[groupString.length - 1].slice(0, groupString[groupString.length - 1].length - 2) + '.';
		else
			groupString = ['No groups assigned.'];

		let requestForm = null;
		if (this.state.showRequestForm && !this.state.event.pendingOverride)
			requestForm = (
				<div className="form-group text-left">
					<label className="font-weight-bold">Request Message:</label>
					<textarea
						tabIndex={2}
						value={this.state.requestMessage}
						onChange={this.handleChangeRequestMessage}
						className="form-control"
						placeholder={
							this.state.requestForAllRecurring ?
								'Describe why you need this timeslot for the entire recurring event.' :
								'Describe why you need this timeslot.'
						}
						rows={3}
					/>
					<div className="d-flex">
						<button onClick={this.hideRequestForm} type="button" className="btn btn-danger mt-2 ml-auto">Cancel</button>
						<button onClick={this.handleRequestTimeSlot} type="button" className="btn btn-primary mt-2 ml-2">Submit Request</button>
					</div>
				</div>
			);

		let pendingOverrideMessage = null;
		if (this.state.event.pendingOverride)
			pendingOverrideMessage = (
				<div className="font-weight-bold mb-2 text-danger">
					<span className="oi oi-loop" />
					&nbsp;
					There is a pending request for this timeslot.
				</div>
			);

		return (
			<div style={backdropStyle}>
				<div className="modal-dialog" role="document">
					<div className="modal-content">
						<div className="modal-header">
							<h5 className="font-weight-bold">
								{this.state.event.title}
							</h5>
							<button type="button" className="close" onClick={this.close} aria-label="Close">
								<span aria-hidden="true">&times;</span>
							</button>
						</div>
						<div className="modal-body pb-0 mb-0">
							<div className="form-group text-left">
								<label className="font-weight-bold">Owner:</label>
								<br />
								{this.state.event.ownerName}
							</div>
							<div className="form-group text-left">
								<label className="font-weight-bold">Description:</label>
								<br />
								<p style={{ wordWrap: 'break-word' }}>
									{descriptionString}
								</p>
							</div>
							{
								this.state.event.recurringInfo &&
								<div className=" text-left">
									<label className="font-weight-bold">Recurrence:</label>
									<br />
									<p style={{ wordWrap: 'break-word' }}>
										{recurringDetailString}
									</p>
								</div>
							}
							<div className="form-group text-left">
								<label className="font-weight-bold">Groups:</label>
								<br />
								{groupString}
							</div>
							{requestForm}
						</div>
						<div className="modal-footer">
							<div className="container-fluid m-0 p-0">
								<div className="d-flex flex-wrap">
									<div className="mr-auto">
										{pendingOverrideMessage}
										<button
											hidden={this.state.showRequestForm || this.state.event.pendingOverride || this.state.showRecurrenceOptions}
											type="button"
											className="btn btn-danger"
											onClick={this.showRecurrenceOptions}
										>
											<span className=" oi oi-loop" />
											<span>&nbsp;&nbsp;</span>
											Request This Timeslot
										</button>
										{
											this.state.showRecurrenceOptions &&
											<div>
												<button
													hidden={this.state.showRequestForm || this.state.event.pendingOverride}
													type="button"
													className="btn btn-danger mr-2"
													onClick={this.handleSetNotRecurring}
												>
													<span className=" oi oi-loop" />
													<span>&nbsp;&nbsp;</span>
													Only This Event
												</button>
												<button
													hidden={this.state.showRequestForm || this.state.event.pendingOverride}
													type="button"
													className="btn btn-danger"
													onClick={this.handleSetRecurring}
												>
													<span className=" oi oi-loop" />
													<span>&nbsp;&nbsp;</span>
													All Recurring
												</button>
											</div>
										}
									</div>
									<div className="mr-0">
										<button tabIndex={3} type="button" className="btn btn-primary" onClick={this.close}>Close</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Modal Open and Close ///////////////////////////////////////////////////////////////////////////////////////////////
	public beginEdit = (event: Event) => {
		this.setState({ event: event, show: true });
	}

	private close = () => {
		this.resetState();
	}

	// Recurrence //////////////////////////////////////////////////////////////////////////////////////////////////////////
	private showRecurrenceOptions = () => {
		if (this.state.event && this.state.event.recurringInfo)
			this.setState({ showRecurrenceOptions: true });
		else
			this.showRequestForm();
	}

	private handleSetRecurring = () => {
		this.setState({ requestForAllRecurring: true, showRecurrenceOptions: false, showRequestForm: true });
	}

	private handleSetNotRecurring = () => {
		this.setState({ requestForAllRecurring: false, showRecurrenceOptions: false, showRequestForm: true });
	}

	private getRecurringDetailString = (): string => {
		let detailString = '';
		if (this.state.event && this.state.event.recurringInfo) {
			let recurringInfo = this.state.event.recurringInfo;
			if (recurringInfo && recurringInfo.type === 'daily')
				detailString = 'Daily from ' + recurringInfo.startDate.format('MM-DD-YYYY') + ' to ' + recurringInfo.endDate.format('MM-DD-YYYY') + '.';
			else if (recurringInfo && recurringInfo.type === 'weekly')
				detailString = 'Weekly on ' + RecurringEvents.getWeeklyCommaString(recurringInfo) +
					', from ' + recurringInfo.startDate.format('MM-DD-YYYY') + ' to ' + recurringInfo.endDate.format('MM-DD-YYYY') + '.';
			else if (recurringInfo && recurringInfo.type === 'monthly')
				detailString = 'Monthly, ' + RecurringEvents.getMonthlyDayIndicatorString(recurringInfo.startDate) + '.';
		}

		return detailString;
	}

	// Request TimeSlot ////////////////////////////////////////////////////////////////////////////////////////////////////
	private showRequestForm = () => {
		this.setState({ showRequestForm: true });
	}

	private hideRequestForm = () => {
		this.setState({ showRequestForm: false, requestMessage: '' });
	}

	private handleChangeRequestMessage = (event: any) => {
		if (event.target.value.length <= 300)
			this.setState({ requestMessage: event.target.value });
	}

	private handleRequestTimeSlot = () => {
		if (this.state.requestMessage.length < 1)
			alert('Please include a message with your request.');
		else {
			this.persistOverrideRequest().then(() => {
				if (this.state.event)
					this.props.handleOverrideRequest(this.state.event.id, this.state.requestForAllRecurring);
			}).catch(() => {
				this.props.handleShowAlert('error', 'Error requesting timeslot.');
			});
		}
	}

	private persistOverrideRequest = (): Promise<void> => {
		return new Promise((resolve, reject) => {
			if (!this.state.event)
				reject();
			else {
				let queryData = {
					insertValues: {
						'EventID': this.state.event.id,
						'LocationName': this.state.event.location,
						'RoomName': this.state.event.room,
						'Message': this.state.requestMessage,
						'Time': this.getCurrentDateTimeInSqlFormat(),
						'RequestorCWID': this.props.cwid,
						'RecurringEventRequest': this.state.requestForAllRecurring ? 1 : 0
					}
				};
				let queryDataString = JSON.stringify(queryData);
				request.put('/api/overriderequests').set('queryData', queryDataString).end((error: {}, res: any) => {
					if (res && res.body)
						resolve();
					else
						reject();
				});
			}
		});
	}

	private getCurrentDateTimeInSqlFormat = () => {
		return new Date().toISOString().slice(0, 19).replace('T', ' ');
	}

	// Reset Everything ////////////////////////////////////////////////////////////////////////////////////////////////////
	private resetState = () => {
		this.setState({
			event: null,
			show: false,
			showRequestForm: false,
			requestMessage: '',
			showRecurrenceOptions: false,
			requestForAllRecurring: false
		});
	}
}

export default UnownedEventModal;