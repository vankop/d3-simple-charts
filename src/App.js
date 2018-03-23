import React, { Component } from 'react';
import { times, range, max } from 'lodash';
import faker from 'faker';
import BarChart from './BarChart';
import PieChart from './PieChart';

const BAR_CHART_MAX_SERIES = 10;
const PIE_CHART_MAX_SERIES = 10;

const names = times(
    max([PIE_CHART_MAX_SERIES, BAR_CHART_MAX_SERIES]),
    () => faker.hacker.noun()
);

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
                </div>
            </div>
        );
    }
}

export default App;
