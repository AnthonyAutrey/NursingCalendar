import * as React from 'react';
const request = require('superagent');

interface Props {
	handleLogin: Function;
}

interface State {
	cwid: string;
	pin: string;
	failedAuthentication: boolean;
}

export class Login extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);

		this.state = {
			cwid: '',
			pin: '',
			failedAuthentication: false
		};
	}

	render() {
		return (
			<div className="continer">
				<div className="bg-light text-center mb-4 pb-4 pt-3 garamond ulm-red border-bottom">
					<div className="d-flex justify-content-center align-items-center">
						<img src="../../ulm-academic-logo-circle.png" alt="logo" style={{ maxWidth: 110 }} />
						<h5 className="display-4 ml-4">ULM Nursing Schedule</h5>
					</div>
				</div>
				<div className="col-xl-4 offset-xl-4 col-lg-6 offset-lg-3">
					<div className="card w-100">
						<div className="card-body">
							<form onSubmit={this.handleSubmit}>
								<h4 className="card-title">Login</h4>
								<hr />
								{
									this.state.failedAuthentication &&
									(<p className="text-danger font-weight-bold">
										Login failed. Please try again.
									</p>)
								}
								<div className="form-group row">
									<div className="col-form-label col-md-3">CWID:</div>
									<div className="col-md-9">
										<input tabIndex={1} autoFocus={true} className="form-control" onChange={this.handleCWIDChange} type="text" />
									</div>
								</div>
								<div className="form-group row">
									<label className="col-form-label col-md-3">PIN:</label>
									<div className="col-md-9">
										<input tabIndex={2} className="form-control" onChange={this.handlePINChange} type="password" />
									</div>
								</div>
								<hr />
								<div className="row">
									<button tabIndex={3} type="submit" className="btn btn-primary btn-block mx-2 mt-2">
										Submit
										<span className="ml-2 oi oi-account-login" style={{ top: 1 }} />
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			</div>
		);
	}

	handleCWIDChange = (event: any) => {
		this.setState({ cwid: event.target.value });
	}

	handlePINChange = (event: any) => {
		this.setState({ pin: event.target.value });
	}

	handleSubmit = (e: any) => {
		e.preventDefault();

		let queryData: {} = {
			cwid: this.state.cwid,
			pin: this.state.pin
		};
		let queryDataString = JSON.stringify(queryData);

		request.post('/api/login').set('queryData', queryDataString).end((error: {}, res: any) => {
			if (res && res.body && res.body.authenticated && res.body.cwid && res.body.role && res.body.firstName && res.body.lastName)
				this.props.handleLogin(res.body.cwid, res.body.role, res.body.firstName, res.body.lastName);
			else
				this.setState({ failedAuthentication: true });
		});
	}
}

export default Login;