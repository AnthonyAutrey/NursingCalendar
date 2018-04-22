import { Moment } from 'moment';

export interface RecurringEventInfo {
	id: string;
	type: 'daily' | 'weekly' | 'monthly';
	monthlyDay: string | undefined;
	weeklyDays: string | undefined;
	startDate: Moment;
	endDate: Moment;
}

export class RecurringEvents {
	public static getDayOfWeekChar = (date: Moment) => {
		let dayMap = {
			0: 'u',
			1: 'm',
			2: 't',
			3: 'w',
			4: 'r',
			5: 'f',
			6: 's',
		};
		let dayOfWeek = date.day();

		return dayMap[dayOfWeek];
	}

	public static getWeekDayCount = (date: Moment): number => {
		let dateChar = RecurringEvents.getDayOfWeekChar(date);
		let beginOfMonth = date.clone().startOf('month');
		let endDate = date.clone();
		let iterateDate = beginOfMonth.clone();

		let dayCount = 0;
		while (iterateDate.isBefore(endDate)) {
			if (dateChar === RecurringEvents.getDayOfWeekChar(iterateDate))
				dayCount++;

			iterateDate.add(1, 'days');
		}

		return dayCount;
	}

	public static getMonthlyDayIndicatorString = (eventStart: Moment): string => {
		let weekDayCount = RecurringEvents.getWeekDayCount(eventStart);
		let dayOfWeekChar = RecurringEvents.getDayOfWeekChar(eventStart);

		let countWordMap = {
			1: 'first',
			2: 'second',
			3: 'third',
			4: 'fourth',
			5: 'last',
		};

		let weekDayMap = {
			'm': 'Monday',
			't': 'Tuesday',
			'w': 'Wednesday',
			'r': 'Thursday',
			'f': 'Friday',
			's': 'Saturday',
			'u': 'Sunday',
		};

		return 'every ' + countWordMap[weekDayCount] + ' ' + weekDayMap[dayOfWeekChar];
	}

	public static getWeeklyCommaString = (recurringInfo: RecurringEventInfo): string => {
		if (recurringInfo) {
			let commaString = '';
			let weekDays = recurringInfo.weeklyDays;
			if (weekDays && weekDays.includes('m'))
				commaString += 'Mon, ';
			if (weekDays && weekDays.includes('t'))
				commaString += 'Tues, ';
			if (weekDays && weekDays.includes('w'))
				commaString += 'Wed, ';
			if (weekDays && weekDays.includes('r'))
				commaString += 'Thurs, ';
			if (weekDays && weekDays.includes('f'))
				commaString += 'Fri, ';
			if (weekDays && weekDays.includes('s'))
				commaString += 'Sat, ';
			if (weekDays && weekDays.includes('u'))
				commaString += 'Sun, ';

			if (commaString.substr(commaString.length - 2) === ', ')
				commaString = commaString.substr(0, commaString.length - 2);

			return commaString;
		} else
			return '';
	}
}