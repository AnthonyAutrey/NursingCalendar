import * as React from 'react';
const request = require('superagent');
const uuid = require('uuid/v4');

interface State {
	groups: Group[];
	selectedGroup: number;
	initialized: boolean;
}

interface Group {
	groupName: string;
	description: string;
	isSelected: boolean;
}

export class ManageTeacherClasses extends React.Component<{}, State> {
	private allGroups: Group[] = [];
	private lastSelectedGroup: Group;

	constructor(props: {}, state: State) {
		super(props, state);
		this.state = {
			groups: [],
			selectedGroup: 0,
			initialized: false
		};
	}

	render() {
		let buttons = this.state.groups.map((group, index) => {
			return (
				<button className="btn btn-secondary" key={uuid()}>{group.groupName}<hr/>{group.description}Hey, this doesn't work!</button>);
		});
		// return buttons;
		return 'this doesn\'t work...';
	}

	componentWillMount() {
		this.getGroupsFromDB();
	}

	getGroupsFromDB = () => {
		request.get('/api/usergroups/' + '11111111').end((error: {}, res: any) => {
			if (res && res.body) {
				let groupNames: any[] = res.body;
				let GroupNameMap = this.parseGroupNamesFromDB(groupNames);
				let parsedGroups = this.parseGroupsFromDB(GroupNameMap);
				this.setState({ groups: parsedGroups, initialized: true });
			}
		});
	}

	parseGroupNamesFromDB(groupNames: any[]): Map<string, string> {
		// HACK: Need a more efficient way of parsing group names. Copying Scheduler code for now.
		let groupNameMap: Map<string, string> = new Map<string, string>();
		groupNames.forEach((groupName: any) => {
			if (!groupNameMap.has(groupName.GroupName)) {
				groupNameMap.set(groupName.GroupName, groupName.GroupName);
			}
		});

		return groupNameMap;
	}

	parseGroupsFromDB(groupNameMap: Map<string, string>): Group[] {
		let parsedGroups: Group[] = [];
		// HACK: Might need an endpoint for grabbing a list of groups based on group name.
		request.get('/api/groups').end((error: {}, res: any) => {
			if (res && res.body) {
				let groups: any[] = res.body;
				let groupMap: Map<string, Group> = new Map<string, Group>();
				groups.forEach((group: any) => {
					if (!groupMap.has(group.GroupName) && groupNameMap.has(group.GroupName)) {
						let newGroup: Group = {
							groupName: group.GroupName,
							description: group.Description,
							isSelected: false
						};
						groupMap.set(group.GroupName, newGroup);
					}
				});
				groupMap.forEach(parsedGroup => {
					parsedGroups.push(parsedGroup);
				});
			}
		});
		return parsedGroups;
	}
}

export default ManageTeacherClasses;