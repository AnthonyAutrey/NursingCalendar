import * as React from 'react';
import { UserGroupsSelector } from './UserGroupsSelector';
const uuid = require('uuid/v4');
const request = require('superagent');

export interface Group {
	name: string;
	description: string;
}

export interface User {
	cwid: string;
	name: string;
	groups: Group[];
	isAdmin: boolean;
}

interface Props {
	handleShowAlert: Function;
	userRole: 'student' | 'instructor';
}

interface State {
	users: User[];
	groups: Group[];
	selectedUserCWID: string;
	loading: boolean;
}

export class ManageUsers extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);
		this.state = {
			users: [],
			groups: [],
			selectedUserCWID: '',
			loading: true
		};
	}

	componentWillMount() {
		this.getUsersFromDB();
		this.getGroupsFromDB();
	}

	render() {
		if (this.state.loading)
			return null;

		let userOptions = this.state.users.map(inst => {
			return (<option key={uuid()} value={inst.cwid}>{inst.name}</option>);
		});

		let selectedUser = this.getSelectedUser();
		console.log(selectedUser);

		let userGroupsSelector = null;
		if (selectedUser)
			userGroupsSelector = (
				<UserGroupsSelector
					user={selectedUser}
					allPossibleGroups={this.state.groups}
					handleChangeGroups={this.handleChangeGroups}
					handleAddGroup={this.handleAddGroup}
					handleDeleteGroup={this.handleDeleteGroup}
					handleChangeIsAdmin={this.handleChangeIsAdmin}
					userRole={this.props.userRole}
				/>
			);

		let titeText = this.props.userRole === 'instructor' ? 'Manage Instructor Rights' : 'Manage Student Classes';
		let labelText = this.props.userRole === 'instructor' ? 'Instructor:' : 'Student:';

		return (
			<div>
				<hr />
				<div className="w-100 px-5">
					<div className="card-body">
						<h4 className="card-title">{titeText}</h4>
						<hr />
						<div className="form-group row">
							<label className="col-lg-4 col-form-label text-left">{labelText}</label>
							<div className="col-lg-8">
								{
									this.state.users.length <= 0 ? '(No instructors available to select)' :
										<select
											className="form-control"
											value={this.state.selectedUserCWID}
											onChange={this.handleSelectedUserChange}
										>
											{userOptions}
										</select>
								}
							</div>
						</div>
						<hr />
						{userGroupsSelector}
						<hr />
						<div className="row">
							<button tabIndex={3} className="btn btn-primary btn-block mx-2 mt-2" onClick={() => this.handlePersistChanges()}>
								Submit Changes
							</button>
						</div>
					</div>
				</div>
				<hr />
			</div>
		);
	}

	// Data Retrieval ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	getUsersFromDB = () => {
		let queryData: {} = {
			where: {
				UserRole: this.props.userRole
			}
		};

		let queryDataString: string = JSON.stringify(queryData);
		request.get('/api/users').set('queryData', queryDataString).end((error: {}, res: any) => {
			if (res && res.body)
				this.parseUsers(res.body);
			else
				this.props.handleShowAlert('error', 'Error getting user data.');
		});
	}

	parseUsers = (dbUsers: any[]) => {
		let users: User[] = [];

		dbUsers.forEach(dBinst => {
			let groups: Group[] = [];
			let dbGroups = Object.keys(dBinst.Groups);
			dbGroups.forEach((dbGroupKey: any) => {
				let dbGroup = dBinst.Groups[dbGroupKey];
				let group: Group = {
					name: dbGroup.Name,
					description: dbGroup.Description
				};
				groups.push(group);
			});

			let user: User = {
				cwid: dBinst.CWID,
				name: dBinst.FirstName + ' ' + dBinst.LastName,
				groups: groups,
				isAdmin: false
			};
			users.push(user);
		});

		let cwid = '';
		if (users[0])
			cwid = users[0].cwid.toString();

		this.setState({ users: users, selectedUserCWID: cwid, loading: false });
	}

	getGroupsFromDB = () => {
		request.get('/api/groups').end((error: {}, res: any) => {
			if (res && res.body)
				this.parseGroups(res.body);
			else
				this.props.handleShowAlert('error', 'Error getting group data.');
		});
	}

	parseGroups = (dbGroups: any[]) => {
		let groups: Group[] = [];
		dbGroups.forEach(dbGroup => {
			let group: Group = {
				name: dbGroup.GroupName,
				description: dbGroup.Description
			};
			groups.push(group);
		});

		this.setState({ groups: groups });
	}

	// Handle Selections //////////////////////////////////////////////////////////////////////////////////////////////////////
	handleSelectedUserChange = (event: any) => {
		event.preventDefault();
		let userCWID = event.target.value;

		this.setState({ selectedUserCWID: userCWID });
	}

	handleChangeIsAdmin = (event: any) => {
		let isAdmin = event.target.checked;

		let user = this.getSelectedUser();
		let users = this.state.users;
		if (user) {
			user.isAdmin = isAdmin;
			users[this.getSelectedUserIndex()] = user;
			this.setState({ users: users });
		}
	}

	handleChangeGroups = (event: any, index: number) => {
		let groupName = event.target.value;
		let selectedGroup = this.state.groups.find(group => {
			return groupName === group.name;
		});
		let user = this.getSelectedUser();
		let users = this.state.users;
		if (user && selectedGroup) {
			user.groups[index] = selectedGroup;
			users[this.getSelectedUserIndex()] = user;
			this.setState({ users: users });
		}
	}

	handleAddGroup = () => {
		let user = this.getSelectedUser();
		let users = this.state.users;
		let unselectedGroups = this.state.groups.filter(group => {
			let selected = true;
			if (user)
				user.groups.forEach(selectedGroup => {
					if (selectedGroup.name === group.name)
						selected = false;
				});

			return selected;
		});

		if (user && unselectedGroups.length > 0) {
			user.groups.push(unselectedGroups[0]);
			users[this.getSelectedUserIndex()] = user;
			this.setState({ users: users });
		}
	}

	handleDeleteGroup = (index: number) => {
		let user = this.getSelectedUser();
		let users = this.state.users;
		if (user) {
			user.groups.splice(index, 1);
			users[this.getSelectedUserIndex()] = user;
			this.setState({ users: users });
		}
	}

	getSelectedUser = () => {
		let selectedUser: User | undefined = this.state.users.find(inst => {
			return inst.cwid.toString() === this.state.selectedUserCWID;
		});

		return selectedUser;
	}

	getSelectedUserIndex = () => {
		let selectedUser: User | undefined = this.state.users.find(inst => {
			return inst.cwid === this.state.selectedUserCWID;
		});

		if (selectedUser)
			return this.state.users.indexOf(selectedUser);
		else
			return -1;
	}

	// Persist Changes ////////////////////////////////////////////////////////////////////////////////////////////////////
	handlePersistChanges = () => {
		this.deleteUserGroups().then(() => {
			Promise.all([this.persistUserGroups(), this.persistMakeAdmin()]).then(() => {
				let users = this.state.users.slice(0);
				users = users.filter(user => {
					return !user.isAdmin;
				});

				let selectedUser = users.find(user => {
					if (user.cwid === this.state.selectedUserCWID)
						return true;
					else
						return false;
				});

				let selectedUserCWID = '';
				if (users.length > 0)
					selectedUserCWID = users[0].cwid.toString();

				if (selectedUser)
					this.setState({ users: users });
				else
					this.setState({ users: users, selectedUserCWID: selectedUserCWID });

				this.props.handleShowAlert('success', 'Successfully submitted changes!');
			}).catch(() => {
				this.props.handleShowAlert('error', 'Error submitting changes. (catch promises)');
			});
		}).catch(() => {
			this.props.handleShowAlert('error', 'Error submitting changes.');
		});
	}

	persistUserGroups = (): Promise<null> => {
		return new Promise((resolve, reject) => {
			let cwids: string[] = [];
			let groups: string[] = [];
			this.state.users.forEach(user => {
				user.groups.forEach(group => {
					cwids.push(user.cwid);
					groups.push(group.name);
				});
			});

			let queryData = {
				insertValues: {
					'CWID': cwids,
					'GroupName': groups,
				}
			};

			let queryDataString = JSON.stringify(queryData);
			request.put('/api/usergroups').set('queryData', queryDataString).end((error: {}, res: any) => {
				if (res && res.body)
					resolve();
				else
					reject();
			});
		});
	}

	persistMakeAdmin = (): Promise<null> => {
		return new Promise((resolve, reject) => {
			let newAdmins = this.state.users.filter(user => {
				return user.isAdmin;
			});

			if (newAdmins.length <= 0)
				resolve();

			let newAdminCWIDS = newAdmins.map(newAdmin => {
				return newAdmin.cwid;
			});

			let queryData = {
				setValues: {
					UserRole: 'administrator'
				},
				where: {
					cwid: newAdminCWIDS
				}
			};

			let queryDataString = JSON.stringify(queryData);
			request.post('/api/users').set('queryData', queryDataString).end((error: {}, res: any) => {
				if (res && res.body)
					resolve();
				else
					reject();
			});
		});
	}

	deleteUserGroups = (): Promise<any> => {
		let cwids = this.state.users.map(user => {
			return user.cwid;
		});

		let queryData: {} = {
			where: {
				CWID: cwids
			}
		};

		let queryDataString: string = JSON.stringify(queryData);

		return new Promise((resolve, reject) => {
			request.delete('/api/usergroups').set('queryData', queryDataString).end((error: {}, res: any) => {
				if (res && res.body)
					resolve();
				else
					reject();
			});
		});
	}
}

export default ManageUsers;