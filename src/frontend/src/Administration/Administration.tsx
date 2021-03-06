import * as React from 'react';
import { PublishPeriod } from './PublishPeriod';
import { Archive } from './Archive';
import { ManageUsers } from './ManageUsers';
import { ManageGroups } from './ManageGroups';
import { LogViewer } from './LogViewer';
import { ManageRooms } from './ManageRooms';
import { ManageResources } from './ManageResources';
import { ManageLocations } from './ManageLocations';

interface Props {
	handleShowAlert: Function;
	cwid: string;
}

interface State {
	showPublishPeriod: boolean;
	showArchive: boolean;
	showManageInstructors: boolean;
	showManageRooms: boolean;
	showManageResources: boolean;
	showManageLocations: boolean;
	showManageGroups: boolean;
	showLogViewer: boolean;
}

export class Administration extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);
		this.state = {
			showPublishPeriod: false,
			showArchive: false,
			showManageInstructors: false,
			showManageRooms: false,
			showManageResources: false,
			showManageLocations: false,
			showManageGroups: false,
			showLogViewer: false
		};
	}

	render() {
		return (
			<div className="col-lg-8 offset-lg-2">
				<button onClick={() => this.setState({ showPublishPeriod: !this.state.showPublishPeriod })} className="btn btn-primary btn-block mb-2" >
					Publish Period
				</button>
				<div className={this.state.showPublishPeriod ? '' : 'd-none'}>
					<PublishPeriod handleShowAlert={this.props.handleShowAlert} />
				</div>
				<button onClick={() => this.setState({ showManageInstructors: !this.state.showManageInstructors })} className="btn btn-primary btn-block mb-2" >
					Manage Instructor Rights
				</button>
				<div className={this.state.showManageInstructors ? '' : 'd-none'}>
					<ManageUsers handleShowAlert={this.props.handleShowAlert} userRole="instructor" />
				</div>
				<button onClick={() => this.setState({ showManageRooms: !this.state.showManageRooms })} className="btn btn-primary btn-block mb-2" >
					Manage Rooms
				</button>
				<div className={this.state.showManageRooms ? '' : 'd-none'}>
					<ManageRooms handleShowAlert={this.props.handleShowAlert}/>
				</div>
				<button onClick={() => this.setState({ showManageResources: !this.state.showManageResources })} className="btn btn-primary btn-block mb-2" >
					Manage Resources
				</button>
				<div className={this.state.showManageResources ? '' : 'd-none'}>
					<ManageResources handleShowAlert={this.props.handleShowAlert}/>
				</div>
				<button onClick={() => this.setState({ showManageLocations: !this.state.showManageLocations })} className="btn btn-primary btn-block mb-2" >
					Manage Locations
				</button>
				<div className={this.state.showManageLocations ? '' : 'd-none'}>
					<ManageLocations handleShowAlert={this.props.handleShowAlert}/>
				</div>
				<button onClick={() => this.setState({ showManageGroups: !this.state.showManageGroups })} className="btn btn-primary btn-block mb-2" >
					Manage Groups
				</button>
				<div className={this.state.showManageGroups ? '' : 'd-none'}>
					<ManageGroups handleShowAlert={this.props.handleShowAlert} />
				</div>
				<button onClick={() => this.setState({ showLogViewer: !this.state.showLogViewer })} className="btn btn-primary btn-block mb-2" >
					Event Logs
				</button>
				<div className={this.state.showLogViewer ? '' : 'd-none'}>
					<LogViewer handleShowAlert={this.props.handleShowAlert} />
				</div>
				<button onClick={() => this.setState({ showArchive: !this.state.showArchive })} className="btn btn-primary btn-block mb-2" >
					Archive Events
				</button>
				<div className={this.state.showArchive ? '' : 'd-none'}>
					<Archive cwid={this.props.cwid} handleShowAlert={this.props.handleShowAlert} />
				</div>
			</div>
		);
	}
}

export default Administration;