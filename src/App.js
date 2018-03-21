import React, { Component } from 'react';
import { times, range } from 'lodash';
import faker from 'faker';
import BarChart from './BarChart';
import PieChart from './PieChart';

class App extends Component {
    componentDidMount() {
        setInterval(() => this.forceUpdate(), 2500);
    }

    render() {
        const VALUE_COUNT = Math.random() * 100 % 17 + 3;
        const SERIES = Math.random() * 100 % 7 + 1;

        const xAxis = times(VALUE_COUNT, () => faker.hacker.noun());

        const series = times(SERIES, index => ({
          name: `serie: ${index}`,
          data: times(VALUE_COUNT, () => Math.round(Math.random() * 200))
        }));

        return (
            <div className="App">
                <BarChart
                    xAxis={xAxis}
                    series={series}
                    width={1000}
                    height={400}
                    min
                />
                {/*<PieChart*/}
                {/*series={series}*/}
                {/*width={500}*/}
                {/*height={500}*/}
                {/*/>*/}
            </div>
        );
    }
}

export default App;
