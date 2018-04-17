import React, { Component } from 'react';
import { times, max } from 'lodash';
import faker from 'faker';
import moment from 'moment';

import BarChart from './BarChart';
import PieChart from './PieChart';
import TimelineChart from './TimelineChart';

const BAR_CHART_MAX_SERIES = 10;
const PIE_CHART_MAX_SERIES = 10;

const names = times(
    max([PIE_CHART_MAX_SERIES, BAR_CHART_MAX_SERIES]),
    () => faker.hacker.noun()
);

const timelineLength = 200;

class App extends Component {

    handleClick = () => this.forceUpdate();

    render() {
        const valueCount = Math.random() * 100 % 17 + 3;
        const barChartSeries = Math.random() * 100 % BAR_CHART_MAX_SERIES + 1;
        const pieChartSeries = Math.random() * 100 % PIE_CHART_MAX_SERIES + 1;

        const xAxis = times(valueCount, () => faker.date.month());

        const barSeries = times(barChartSeries, index => ({
          name: names[index],
          data: times(valueCount, () => Math.round(Math.random() * 200))
        }));

        const pieSeries = times(pieChartSeries, index => ({
            name: names[index],
            data: Math.round(Math.random() * 200)
        }));

        const timelineDuration = moment.duration(2, 'year').asHours();

        const timeline = [];

        let timelineStart = moment().valueOf();

        const timelineStep = Math.floor(timelineDuration / timelineLength);

        for (let  i = 0; i < timelineLength; i++) {
            timeline[i] = {
                value: Math.round(Math.random() * 300 + 100),
                datetime: timelineStart + i * timelineStep * 1000 * 60 * 60
            };
        }

        return (
            <div>
                <button onClick={this.handleClick}>Update</button>
                <div className="App">
                    <BarChart
                        xAxis={xAxis}
                        series={barSeries}
                        width={1000}
                        height={600}
                        min
                    />
                    <PieChart
                        series={pieSeries}
                        width={500}
                        height={500}
                    />
                    <TimelineChart
                        min
                        timeline={timeline}
                        color="steelblue"
                        width={700}
                        height={500}
                    />
                </div>
            </div>
        );
    }
}

export default App;
