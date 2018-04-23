import * as React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Login } from './Login/Login';
import { NavigationBar } from './Navigation/NavigationBar';
import { Scheduler } from './Scheduler/Scheduler';
import { ViewingCalendar } from './Home/ViewingCalendar';
import { Administration } from './Administration/Administration';
import { ManageUsers } from './Administration/ManageUsers';
import { Archive } from './Administration/Archive';
import { Alert } from './Generic/Alert';
import { Loading } from './Generic/Loading';
import { NotFound } from './Generic/NotFound';
const request = require('superagent');

interface State {
	sessionRetreived: boolean;
	cwid?: number;
	role?: string;
	name?: string;
	activeRoute: string;
}

class App extends React.Component<{}, State> {
	private alert: Alert | null = null;

	constructor(props: {}, state: State) {
		super(props, state);

		this.state = { sessionRetreived: false, activeRoute: '' };
	}

	componentWillMount() {
		this.getSession();
	}

	render() {
		if (!this.state.sessionRetreived)
			return <Loading />;

		if (!(this.state.cwid && this.state.role))
			return <Login handleLogin={this.handleLogin} />;

		return (
			<div className="App">
				<Alert ref={alert => { this.alert = alert; }} />
				<NavigationBar
					cwid={this.state.cwid}
					role={this.state.role}
					name={this.state.name}
					activeRoute={this.state.activeRoute}
					handleLogout={this.handleLogout}
				/>
				<Router>
					<Switch>
						{this.getRoutesAvailableToRole()}
					</Switch>
				</Router>
			</div>
		);
	}
	// Log in/out //////////////////////////////////////////////////////////////////////////////////////////////////////////
	getSession = () => {
		request.get('/api/session').end((error: {}, res: any) => {
			if (res && res.body) {
				this.setState({ sessionRetreived: true });
				if (res.body.cwid && res.body.role && res.body.firstName && res.body.lastName)
					this.setState({ cwid: res.body.cwid, role: res.body.role, name: res.body.firstName + ' ' + res.body.lastName });
			}
		});
	}

	handleLogin = (cwid: number, role: string, firstName: string, lastName: string) => {
		this.setState({ sessionRetreived: true, cwid: cwid, role: role, name: firstName + ' ' + lastName });
	}

	handleLogout = () => {
		request.get('/api/logout').end((error: {}, res: any) => {
			if (res && res.body)
				location.reload();
			else
				this.handleShowAlert('error', 'Error logging out.');
		});
	}

	// Alert ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	handleShowAlert = (style: 'success' | 'error', message: string) => {
		if (this.alert)
			this.alert.display(style, message);
	}

	// Routes //////////////////////////////////////////////////////////////////////////////////////////////////////////////
	getRoutesAvailableToRole(): JSX.Element[] {
		let routes: JSX.Element[] = [
			(
				<Route key="/" path="/" exact={true}>
					<ViewingCalendar cwid={this.state.cwid || 0} role={this.state.role || ''} handleActiveRouteChange={this.handleActiveRouteChange} />
				</ Route>
			),
			(<Route key="/classes" path="/classes" component={() => <div>Create Manage Classes Component!</div>} />)
		];

		if (this.state.role === 'instructor' || this.state.role === 'administrator')
			routes.push(
				(
					<Route key="/schedule" path="/schedule" >
						<Scheduler
							handleActiveRouteChange={this.handleActiveRouteChange}
							cwid={this.state.cwid || 0}
							role={this.state.role || ''}
							handleShowAlert={this.handleShowAlert}
						/>
					</Route>
				)
			);

		if (this.state.role === 'administrator')
			routes.push(
				(
					<Route key="/administration" path="/administration">
						<Administration cwid={Number(this.state.cwid).toString() || ''} handleShowAlert={this.handleShowAlert} />
					</Route>
				)
			);

		routes.push(
			<Route key="404" component={NotFound} />
		);

		return routes;
	}

	handleActiveRouteChange = (route: string) => {
		this.setState({ activeRoute: route });
	}
}

export default App;
