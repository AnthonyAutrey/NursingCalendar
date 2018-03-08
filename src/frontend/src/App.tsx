import * as React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { Login } from './Login/Login';
import { NavigationBar } from './Navigation/NavigationBar';
import { Scheduler } from './Scheduler/Scheduler';
import { ViewingCalendar } from './Home/ViewingCalendar';
import { Administration } from './Administration/Administration';
import { ManageTeacherClasses } from './ManageClasses/ManageTeacherClasses';
import { Alert } from './Generic/Alert';
import { Loading } from './Generic/Loading';
import { NotFound } from './Generic/NotFound';
const request = require('superagent');

interface State {
	sessionRetreived: boolean;
	cwid?: number;
	role?: string;
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
				<NavigationBar cwid={this.state.cwid} role={this.state.role} activeRoute={this.state.activeRoute} handleLogout={this.handleLogout} />
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
				if (res.body.cwid && res.body.role)
					this.setState({ cwid: res.body.cwid, role: res.body.role });
			}
		});
	}

	handleLogin = () => {
		this.getSession();
		this.forceUpdate();
	}

	handleLogout = () => {
		request.get('/api/logout').end((error: {}, res: any) => {
			this.setState({ cwid: undefined, role: undefined }, () => {
				return <Redirect to="/" />;
			});
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
			(<Route key="/classes" path="/classes" component={ManageTeacherClasses} />)
		];

		if (this.state.role === 'instructor' || this.state.role === 'administrator')
			routes.push(
				<Route key="/schedule" path="/schedule" >
					<Scheduler handleActiveRouteChange={this.handleActiveRouteChange} cwid={this.state.cwid || 0} role={this.state.role || ''} />
				</Route>
			);

		if (this.state.role === 'administrator')
			routes.push(
				<Route key="/administration" path="/administration">
					<Administration handleShowAlert={this.handleShowAlert} />
				</Route>
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
